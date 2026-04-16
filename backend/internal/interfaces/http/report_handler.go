package http

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type ReportHandler struct {
	uc       usecase.ReportUsecase
	eventUC  *usecase.EventUsecase
	notifyUC *usecase.NotificationUsecase
	db       *gorm.DB
}

func NewReportHandler(
	uc usecase.ReportUsecase,
	euc *usecase.EventUsecase,
	db *gorm.DB,
	n *usecase.NotificationUsecase,
) *ReportHandler {
	return &ReportHandler{uc: uc, eventUC: euc, notifyUC: n, db: db}
}

func (h *ReportHandler) RegisterRoutes(r *gin.Engine) {
	g := r.Group("/reports")
	g.POST("", h.createReport)
	g.GET("", h.List)
	g.GET("/organizer/:id", h.ListByOrganizer) // เพิ่ม
	g.PATCH("/:id/status", h.UpdateStatus)
	g.DELETE("/:id", h.DeleteReport)

	g.POST("/:id/notify-owner", h.notifyOwner)
	g.POST("/:id/notify-subject", h.notifyOwner)
}

func (h *ReportHandler) Create(c *gin.Context) {
	var req struct {
		EventID int    `json:"event_id"`
		UserID  int    `json:"user_id"`
		Reason  string `json:"reason"`
		Details string `json:"details"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.String(http.StatusBadRequest, "invalid json: %v", err)
		return
	}
	if req.EventID <= 0 || req.UserID <= 0 || strings.TrimSpace(req.Reason) == "" {
		c.String(http.StatusBadRequest, "event_id, user_id, reason are required")
		return
	}

	rep := &entity.Report{
		EventID: req.EventID,
		UserID:  req.UserID,
		Reason:  strings.TrimSpace(req.Reason),
		Details: strings.TrimSpace(req.Details),
		Status:  "pending",
	}
	if err := h.uc.Create(c.Request.Context(), rep); err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusCreated, rep)
}

func (h *ReportHandler) List(c *gin.Context) {
	reps, err := h.uc.List(c.Request.Context())
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, reps)
}

func (h *ReportHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	rep, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.String(http.StatusNotFound, err.Error())
		return
	}
	c.JSON(http.StatusOK, rep)
}

func (h *ReportHandler) UpdateStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.String(http.StatusBadRequest, "invalid json: %v", err)
		return
	}
	if err := h.uc.UpdateStatus(c.Request.Context(), id, body.Status); err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ReportHandler) ListByEvent(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	reps, err := h.uc.ListByEvent(c.Request.Context(), eventID)
	if err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, reps)
}

// ลบรายงานโดยใช้ gorm.DB (ไว้อำนวยความสะดวก หากต้องการให้ไปทาง usecase ให้ย้ายต่อ)
func (h *ReportHandler) DeleteReport(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		c.String(http.StatusBadRequest, "invalid id")
		return
	}
	if h.db == nil {
		c.String(http.StatusInternalServerError, "db not injected")
		return
	}
	res := h.db.WithContext(c.Request.Context()).Delete(&entity.Report{}, id)
	if res.Error != nil {
		c.String(http.StatusInternalServerError, res.Error.Error())
		return
	}
	if res.RowsAffected == 0 {
		c.String(http.StatusNotFound, "report not found")
		return
	}
	c.Status(http.StatusNoContent)
}

// หา user_id ของเจ้าของอีเวนท์จากตาราง events (user_id หรือ created_by)
func (h *ReportHandler) resolveOwnerUserID(ctx context.Context, eventID int) (int, error) {
	if h.db == nil {
		return 0, errors.New("db not injected")
	}
	var uid sql.NullInt64

	// 1) ลอง field user_id
	if err := h.db.WithContext(ctx).Raw(
		"SELECT user_id FROM events WHERE event_id = ? LIMIT 1", eventID,
	).Scan(&uid).Error; err == nil && uid.Valid && uid.Int64 > 0 {
		return int(uid.Int64), nil
	}

	// 2) ลอง field created_by (ถ้ามี)
	uid = sql.NullInt64{}
	if err := h.db.WithContext(ctx).Raw(
		"SELECT created_by FROM events WHERE event_id = ? LIMIT 1", eventID,
	).Scan(&uid).Error; err == nil && uid.Valid && uid.Int64 > 0 {
		return int(uid.Int64), nil
	}

	// ไม่พบเจ้าของ
	return 0, errors.New("owner user not found on event")
}

func (h *ReportHandler) createReport(c *gin.Context) {
	var in entity.Report
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	if err := h.uc.Create(c.Request.Context(), &in); err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// แจ้ง “ผู้รายงาน”
	_ = h.notifyUC.NotifyUser(c.Request.Context(), in.UserID, "รับเรื่องรายงานแล้ว", "เราได้รับรายงานของคุณแล้ว ทีมงานกำลังตรวจสอบ")

	c.JSON(http.StatusCreated, in)
}

// เพิ่ม handler สำหรับดึงรายงานของ organizer
func (h *ReportHandler) ListByOrganizer(c *gin.Context) {
	organizerID, _ := strconv.Atoi(c.Param("id"))
	if organizerID <= 0 {
		c.String(http.StatusBadRequest, "invalid id")
		return
	}
	reps, err := h.uc.ListByOrganizer(c.Request.Context(), organizerID)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, reps)
}

// notifyOwner: ปรับให้รองรับกรณี report เกี่ยวกับ organizer
func (h *ReportHandler) notifyOwner(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	rep, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil || rep == nil {
		c.String(http.StatusNotFound, "report not found")
		return
	}

	var ownerID int
	// ถ้ามี organizer_id ให้ใช้เจ้าของจาก organizers
	if rep.OrganizerID != nil && *rep.OrganizerID > 0 {
		var uid sql.NullInt64
		if err := h.db.WithContext(c.Request.Context()).
			Raw("SELECT user_id FROM organizers WHERE organizer_id = ? LIMIT 1", *rep.OrganizerID).
			Scan(&uid).Error; err == nil && uid.Valid && uid.Int64 > 0 {
			ownerID = int(uid.Int64)
		} else {
			c.String(http.StatusBadRequest, "cannot resolve organizer owner")
			return
		}
	} else {
		ownerID, err = h.resolveOwnerUserID(c.Request.Context(), rep.EventID)
		if err != nil || ownerID == 0 {
			c.String(http.StatusBadRequest, "cannot resolve event owner: "+err.Error())
			return
		}
	}

	// เตรียม payload
	payload := map[string]any{
		"kind":         "report_notice",
		"event_id":     rep.EventID,
		"organizer_id": rep.OrganizerID,
		"report_id":    rep.ReportID,
		"reason":       rep.Reason,
		"details":      rep.Details,
	}
	dataBytes, _ := json.Marshal(payload)

	// ส่งแจ้งเตือน
	if err := h.notifyUC.NotifyUserWithData(
		c.Request.Context(),
		ownerID,
		"โปรดตรวจสอบรายการที่ถูกรายงาน",
		"มีรายงานจากผู้ใช้ โปรดตรวจสอบและดำเนินการ",
		string(dataBytes),
	); err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	if cnt, e := h.notifyUC.CountUnread(c.Request.Context(), ownerID); e == nil {
		log.Printf("[reports] notify-owner ok: user_id=%d unread=%d", ownerID, cnt)
	}
	c.Status(http.StatusNoContent)
}
