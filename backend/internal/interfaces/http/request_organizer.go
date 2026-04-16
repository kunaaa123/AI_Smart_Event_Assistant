package http

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type RequestOrganizerHandler struct {
	usecase        *usecase.RequestOrganizerUsecase
	imageUsecase   *usecase.RequestOrganizerImageUsecase
	db             *gorm.DB
	notificationUC *usecase.NotificationUsecase // <-- เพิ่ม
	mailer         ApprovalEmailSender          // <-- เพิ่ม
}

type ApprovalEmailSender interface {
	Send(to, subject, html string) error
}

func NewRequestOrganizerHandler(uc *usecase.RequestOrganizerUsecase, imgUC *usecase.RequestOrganizerImageUsecase, db *gorm.DB, notifUC *usecase.NotificationUsecase, mailer ApprovalEmailSender) *RequestOrganizerHandler {
	return &RequestOrganizerHandler{usecase: uc, imageUsecase: imgUC, db: db, notificationUC: notifUC, mailer: mailer}
}

func (h *RequestOrganizerHandler) RegisterRoutes(router *gin.Engine) {
	reqs := router.Group("/request_organizers")
	{
		reqs.GET("", h.GetAll)
		reqs.GET("/:id", h.GetByID)
		reqs.GET("/:id/images", h.GetImages) // <-- เพิ่มตรงนี้
		reqs.POST("", h.Create)
		reqs.PUT("/:id", h.Update)
		reqs.DELETE("/:id", h.Delete)
		reqs.POST("/:id/approve", h.Approve)

		// added: reject + revoke
		reqs.POST("/:id/reject", h.Reject)
		reqs.POST("/:id/revoke", h.Revoke)
	}
}

func (h *RequestOrganizerHandler) GetAll(c *gin.Context) {
	reqs, err := h.usecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reqs)
}

func (h *RequestOrganizerHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	req, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *RequestOrganizerHandler) Create(c *gin.Context) {
	contentType := c.ContentType()
	var reqUserID int
	var organizerName, category, email, price, phone, description, imageLabel string
	var savedPaths []string

	// old:
	// uploadDir := filepath.Join(".", "cmd", "api", "uploads")
	// change to use shared UploadsDir + subfolder
	dstBase := UploadsDir
	if dstBase == "" {
		dstBase = filepath.Join(".", "cmd", "api", "uploads")
	}
	sub := "request_organizers"
	uploadDir := filepath.Join(dstBase, sub)
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Printf("failed to create upload dir: %v", err)
		// continue — SaveUploadedFile may still fail
	}

	if strings.HasPrefix(contentType, "multipart/form-data") {
		if v := c.PostForm("user_id"); v != "" {
			reqUserID, _ = strconv.Atoi(v)
		}
		organizerName = c.PostForm("organizer_name")
		category = c.PostForm("category")
		email = c.PostForm("email")
		price = c.PostForm("price")
		phone = c.PostForm("phone")
		description = c.PostForm("description")

		// safer: use c.MultipartForm()
		if mf, err := c.MultipartForm(); err == nil && mf != nil {
			files := mf.File["images"]
			for _, fh := range files {
				// unique filename + save into uploads/request_organizers
				name := NewUniqueFilename(fh.Filename)
				dstPath := filepath.Join(uploadDir, name)
				if err := c.SaveUploadedFile(fh, dstPath); err != nil {
					log.Printf("SaveUploadedFile error: %v (src=%s dst=%s)", err, fh.Filename, dstPath)
					continue
				}
				savedPaths = append(savedPaths, fmt.Sprintf("/uploads/%s/%s", sub, name))
			}
		} else {
			log.Printf("MultipartForm error: %v", err)
		}

		if len(savedPaths) > 0 {
			// เก็บ cover แค่รายการแรก
			imageLabel = savedPaths[0]
			// กันค่าที่ยาวเกิน โดยใช้ basename ก่อน แล้วค่อยตัดให้สั้น
			if len(imageLabel) > 250 {
				base := filepath.Base(imageLabel)
				if len(base) > 250 {
					base = base[len(base)-250:]
				}
				imageLabel = base
			}
		}
	} else {
		// fallback JSON (unchanged)
		var jr struct {
			UserID        int    `json:"user_id"`
			OrganizerName string `json:"organizer_name"`
			Category      string `json:"category"`
			Email         string `json:"email"`
			Price         string `json:"price"`
			Phone         string `json:"phone"`
			Description   string `json:"description"`
			ImageLabel    string `json:"imageLabel"`
		}
		if err := c.ShouldBindJSON(&jr); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		reqUserID = jr.UserID
		organizerName = jr.OrganizerName
		category = jr.Category
		email = jr.Email
		price = jr.Price
		phone = jr.Phone
		description = jr.Description
		imageLabel = jr.ImageLabel
	}

	// ===== new: prevent duplicate submissions =====
	if reqUserID != 0 {
		var existingCount int64
		if err := h.db.Table("request_organizers").
			Where("user_id = ? AND status IN ?", reqUserID, []string{"pending", "approved"}).
			Count(&existingCount).Error; err == nil && existingCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "คุณมีคำร้องที่ยังรอดำเนินการหรืออนุมัติแล้ว"})
			return
		}

		var role string
		var suspended bool
		_ = h.db.Table("users").
			Select("role, is_suspended").
			Where("user_id = ?", reqUserID).
			Row().
			Scan(&role, &suspended)

		// บล็อกเฉพาะ organizer ที่ไม่ถูกระงับ (ใช้งานได้แล้ว)
		if strings.ToLower(role) == "organizer" && !suspended {
			c.JSON(http.StatusBadRequest, gin.H{"error": "บัญชีนี้เป็นผู้จัดอยู่แล้ว"})
			return
		}
	}
	// ===== end new =====

	// สร้างเรคคอร์ด request
	request := entity.RequestOrganizer{
		UserID:        reqUserID,
		OrganizerName: organizerName,
		Category:      category,
		Email:         email,
		Price:         price,
		Phone:         phone,
		Description:   description,
		ImageLabel:    imageLabel,
	}

	// ensure new requests default to pending
	if strings.TrimSpace(request.Status) == "" {
		request.Status = "pending"
	}

	if err := h.usecase.Create(c.Request.Context(), &request); err != nil {
		log.Printf("DB create request_organizer error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save request"})
		return
	}

	// สร้างแถวรูปแยก (request_organizer_images)
	for i, p := range savedPaths {
		img := entity.RequestOrganizerImage{
			RequestID: request.RequestID,
			ImageURL:  p,
			IsCover:   i == 0,
		}
		if err := h.imageUsecase.Create(c.Request.Context(), &img); err != nil {
			log.Printf("failed to save request image record: %v (url=%s)", err, p)
		}
	}

	// ===== new: create "submitted" notification for user =====
	if h.notificationUC != nil && reqUserID != 0 {
		_ = h.notificationUC.Create(c.Request.Context(), &entity.Notification{
			UserID:  reqUserID,
			Type:    "request_organizer",
			Message: "คำร้องขอของคุณถูกส่งแล้ว รอการตรวจสอบจากผู้ดูแล",
			Data:    "", // ถ้าต้องการใส่ลิงก์ไปยังหน้า status ให้ใส่ตรงนี้
		})
	}
	// ===== end new =====

	c.JSON(http.StatusCreated, gin.H{"message": "Request submitted successfully", "images": savedPaths})
}

func (h *RequestOrganizerHandler) Update(c *gin.Context) {
	var req entity.RequestOrganizer
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.usecase.Update(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *RequestOrganizerHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.usecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "RequestOrganizer deleted successfully"})
}

func (h *RequestOrganizerHandler) Approve(c *gin.Context) {
	id := c.Param("id")
	// ดึง request
	reqEntity, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil || reqEntity == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// update users.role = 'organizer' และปลดระงับ
	if err := h.db.Model(&entity.User{}).
		Where("user_id = ?", reqEntity.UserID).
		Updates(map[string]interface{}{"role": "organizer", "is_suspended": false}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role/suspension"})
		return
	}

	// สร้างแถวใน organizers หากยังไม่มี
	var cnt int64
	if err := h.db.Table("organizers").Where("user_id = ?", reqEntity.UserID).Count(&cnt).Error; err != nil {
		log.Printf("count organizers error: %v", err)
	} else if cnt == 0 {
		createData := map[string]interface{}{
			"user_id":    reqEntity.UserID,
			"created_at": time.Now(),
			// เติมคอลัมน์อื่นถ้ามีในตาราง organizers ของคุณ เช่น "expertise": "", ...
		}
		if err := h.db.Table("organizers").Create(createData).Error; err != nil {
			log.Printf("create organizers error: %v", err)
		}
	}

	// mark request as approved
	reqEntity.Status = "approved"
	if err := h.usecase.Update(c.Request.Context(), reqEntity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request status"})
		return
	}

	// เพิ่ม notification
	_ = h.notificationUC.Create(c.Request.Context(), &entity.Notification{
		UserID:  reqEntity.UserID,
		Type:    "request_organizer",
		Message: "คำร้องขอเป็นผู้จัดของคุณได้รับการอนุมัติแล้ว",
		Data:    "",
	})

	// ✅ ส่งอีเมลแจ้งผลอนุมัติ (ไม่บล็อก flow)
	if h.mailer != nil {
		var u entity.User
		if err := h.db.First(&u, "user_id = ?", reqEntity.UserID).Error; err == nil && u.Email != "" {
			fullName := strings.TrimSpace(fmt.Sprintf("%s %s", u.FirstName, u.LastName))
			if fullName == "" {
				fullName = u.Username
			}
			subject := "แจ้งผลอนุมัติผู้จัดอีเว้นท์ - Smart Event Assistant"
			html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#2b2d42;background:#f7f9fc;margin:0;padding:24px;}
  .card{max-width:640px;margin:0 auto;background:#fff;border:1px solid #edf2f7;border-radius:12px;overflow:hidden}
  .hd{background:#2b6cb0;color:#fff;padding:20px 24px;font-size:18px;font-weight:600}
  .bd{padding:24px}
  .p{margin:0 0 14px 0;line-height:1.7;color:#334155}
  .kv{background:#f8fafc;border:1px solid #eef2f7;border-radius:8px;padding:14px 16px;margin:14px 0}
  .kv div{margin:4px 0}
  .ft{padding:18px 24px;font-size:12px;color:#64748b;border-top:1px solid #f1f5f9}
</style></head>
<body>
  <div class="card">
    <div class="hd">ผลการสมัครผู้จัดอีเว้นท์</div>
    <div class="bd">
      <p class="p">เรียนคุณ %s,</p>
      <p class="p">ขอแสดงความยินดี! คำร้องขอสมัครเป็นผู้จัดอีเว้นท์ของท่านได้รับการอนุมัติเรียบร้อยแล้ว</p>
      <div class="kv">
        <div><strong>ชื่อผู้จัด:</strong> %s</div>
        <div><strong>ประเภทงาน:</strong> %s</div>
        <div><strong>วันที่อนุมัติ:</strong> %s</div>
      </div>
      <p class="p">ท่านสามารถเข้าสู่ระบบและเริ่มจัดการผลงาน/อีเว้นท์ของท่านได้ทันที หากต้องการความช่วยเหลือ โปรดติดต่อทีมงาน</p>
      <p class="p">ขอแสดงความนับถือ,<br/>Smart Event Assistant</p>
    </div>
    <div class="ft">อีเมลฉบับนี้ถูกส่งจากระบบอัตโนมัติ โปรดอย่าตอบกลับ</div>
  </div>
</body>
</html>`,
				fullName,
				reqEntity.OrganizerName,
				reqEntity.Category,
				time.Now().Format("2 January 2006 เวลา 15:04 น."),
			)

			if err := h.mailer.Send(u.Email, subject, html); err != nil {
				log.Printf("send approval email failed: %v", err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request approved"})
}

func (h *RequestOrganizerHandler) Reject(c *gin.Context) {
	id := c.Param("id")
	reqEntity, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil || reqEntity == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// mark request as rejected
	reqEntity.Status = "rejected"
	if err := h.usecase.Update(c.Request.Context(), reqEntity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request status"})
		return
	}

	// เพิ่ม notification
	_ = h.notificationUC.Create(c.Request.Context(), &entity.Notification{
		UserID:  reqEntity.UserID,
		Type:    "request_organizer",
		Message: "คำร้องขอเป็นผู้จัดของคุณถูกปฏิเสธ",
		Data:    "", // ใส่ลิงก์ถ้าต้องการ
	})

	c.JSON(http.StatusOK, gin.H{"message": "Request rejected"})
}

func (h *RequestOrganizerHandler) Revoke(c *gin.Context) {
	id := c.Param("id")
	reqEntity, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil || reqEntity == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// downgrade user role back to member
	if err := h.db.Model(&entity.User{}).Where("user_id = ?", reqEntity.UserID).Update("role", "member").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	// mark request as revoked
	reqEntity.Status = "revoked"
	if err := h.usecase.Update(c.Request.Context(), reqEntity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role revoked and request updated"})
}

func (h *RequestOrganizerHandler) GetImages(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request id"})
		return
	}

	imgs, err := h.imageUsecase.GetByRequestID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// trả về array ของ entity.RequestOrganizerImage (มี json tags แล้ว)
	c.JSON(http.StatusOK, imgs)
}

type CategoryHandler struct {
	db *gorm.DB
}

func NewCategoryHandler(db *gorm.DB) *CategoryHandler {
	return &CategoryHandler{db: db}
}

func (h *CategoryHandler) RegisterRoutes(router *gin.Engine) {
	router.GET("/categories", h.GetAll)
}

func (h *CategoryHandler) GetAll(c *gin.Context) {
	var cats []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}
	if err := h.db.Table("event_categories").Select("id, name").Order("name").Find(&cats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cats)
}
