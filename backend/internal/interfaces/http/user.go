package http

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type UserHandler struct {
	userUsecase *usecase.UserUsecase
	db          *gorm.DB
}

func NewUserHandler(uc *usecase.UserUsecase, db *gorm.DB) *UserHandler {
	return &UserHandler{
		userUsecase: uc,
		db:          db,
	}
}

func (h *UserHandler) Register(c *gin.Context) {
	var req struct {
		Username  string `json:"username"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Phone     string `json:"phone"`
		Bio       string `json:"bio"`
		Role      string `json:"role"` // <-- เพิ่ม
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// ตรวจสอบซ้ำ (email ห้ามซ้ำ)
	existing, _ := h.userUsecase.GetByEmail(c.Request.Context(), req.Email)
	if existing != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	// validate role input
	role := strings.ToLower(strings.TrimSpace(req.Role))
	if role != entity.RoleMember && role != entity.RoleOrganizer {
		role = entity.RoleMember
	}

	user := entity.NewUser(req.Username, req.Email, req.Password)
	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = req.Phone
	user.Bio = req.Bio

	// หากผู้ใช้เลือก "organizer" ตอนสมัคร:
	// - เก็บเป็น role=member ไปก่อน
	// - ตั้ง is_suspended=true เพื่อห้ามล็อกอินจนกว่า Admin อนุมัติ
	if role == entity.RoleOrganizer {
		user.Role = entity.RoleMember
		user.IsSuspended = true
	} else {
		user.Role = entity.RoleMember
	}

	if err := h.userUsecase.Create(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// อย่าสร้าง organizers ที่นี่ รอจนกว่าจะ approved
	organizerID := 0

	c.JSON(http.StatusCreated, gin.H{
		"message": "Register successful",
		"user": gin.H{
			"user_id":       user.UserID,
			"username":      user.Username,
			"email":         user.Email,
			"role":          user.Role,
			"organizer_id":  organizerID,
			"first_name":    user.FirstName,
			"last_name":     user.LastName,
			"phone":         user.Phone,
			"bio":           user.Bio,
			"profile_image": user.ProfileImage,
			"is_suspended":  user.IsSuspended,
		},
	})
}

// GET /admins — รายชื่อผู้ใช้ที่เป็นแอดมิน
func (h *UserHandler) ListAdmins(c *gin.Context) {
	var admins []entity.User
	if err := h.db.WithContext(c.Request.Context()).
		Where("role = ?", entity.RoleAdmin).
		Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list admins"})
		return
	}
	c.JSON(http.StatusOK, admins)
}

// PATCH /users/:id/role — อัปเดตบทบาทผู้ใช้
func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Role == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role is required"})
		return
	}
	role := strings.ToLower(strings.TrimSpace(body.Role))
	if role != entity.RoleMember && role != entity.RoleOrganizer && role != entity.RoleAdmin {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}
	// อัปเดต role
	if err := h.db.WithContext(c.Request.Context()).
		Model(&entity.User{}).
		Where("user_id = ?", id).
		Update("role", role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update role"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// POST /admins/bulk — เลื่อนขั้นผู้ใช้หลายคนเป็นแอดมิน
func (h *UserHandler) BulkPromoteAdmins(c *gin.Context) {
	var body struct {
		UserIDs []uint `json:"user_ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.UserIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_ids is required"})
		return
	}
	if err := h.db.WithContext(c.Request.Context()).
		Model(&entity.User{}).
		Where("user_id IN ?", body.UserIDs).
		Update("role", entity.RoleAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to promote admins"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "count": len(body.UserIDs)})
}

func (h *UserHandler) RegisterRoutes(router *gin.Engine) {
	// เพิ่ม route group
	users := router.Group("/users")
	{
		users.POST("/register", h.Register)
		users.GET("", h.GetAllUsers)
		users.GET("/:id", h.GetUser)
		users.POST("", h.CreateUser)
		users.PUT("/:id", h.UpdateUser)
		users.DELETE("/:id", h.DeleteUser)
		users.POST("/:id/profile-image", h.UploadProfileImage)

		// เพิ่มสอง endpoint ใหม่
		users.PATCH("/:id/basic", h.UpdateBasicProfile) // อัปเดต username + email
		users.PUT("/:id/password", h.ChangePassword)    // เปลี่ยนรหัสผ่าน
		users.PATCH("/:id/suspend", h.SuspendUser)      // เพิ่ม endpoint สำหรับระงับผู้ใช้

		// เพิ่ม: ค้นหาผู้ใช้ด้วยอีเมล
		users.GET("/find", h.FindByEmail)
	}
	// admin routes
	router.GET("/admins", h.ListAdmins)
	router.PATCH("/users/:id/role", h.UpdateUserRole)
	router.POST("/admins/bulk", h.BulkPromoteAdmins)
}

// เพิ่ม handler function สำหรับดึงข้อมูลทั้งหมด
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userUsecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var user entity.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.userUsecase.Create(c.Request.Context(), &user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var organizerID int
	h.db.Table("organizers").Select("organizer_id").Where("user_id = ?", user.UserID).Scan(&organizerID)

	c.JSON(http.StatusOK, gin.H{
		"user_id":       user.UserID,
		"username":      user.Username,
		"email":         user.Email,
		"role":          user.Role,
		"organizer_id":  organizerID, // เพิ่มตรงนี้!
		"first_name":    user.FirstName,
		"last_name":     user.LastName,
		"phone":         user.Phone,
		"bio":           user.Bio,
		"profile_image": user.ProfileImage,
		"created_at":    user.CreatedAt,
		// ...field อื่นๆ
	})
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var updatedUser entity.User
	if err := c.ShouldBindJSON(&updatedUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingUser, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil || existingUser == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// อัปเดตฟิลด์ใหม่
	existingUser.FirstName = updatedUser.FirstName
	existingUser.LastName = updatedUser.LastName
	existingUser.Phone = updatedUser.Phone
	existingUser.Bio = updatedUser.Bio
	existingUser.Email = updatedUser.Email

	err = h.userUsecase.Update(c.Request.Context(), id, existingUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    existingUser,
	})

	fmt.Println("will update first_name:", existingUser.FirstName)
	fmt.Println("will update last_name:", existingUser.LastName)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	err := h.userUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// เพิ่ม handler functions อื่นๆ ตามต้องการ

func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var organizerID int
	h.db.Table("organizers").Select("organizer_id").Where("user_id = ?", user.UserID).Scan(&organizerID)

	c.JSON(http.StatusOK, gin.H{
		"user_id":      user.UserID,
		"username":     user.Username,
		"email":        user.Email,
		"role":         user.Role,
		"organizer_id": organizerID, // เพิ่มตรงนี้
		// ...field อื่นๆ
	})
}

func (h *UserHandler) UploadProfileImage(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	file, err := c.FormFile("profile_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Use canonical UploadsDir set in main.go (fallback to ./uploads)
	dstBase := UploadsDir
	if dstBase == "" {
		dstBase = "./uploads"
	}
	sub := "users"
	dstDir := filepath.Join(dstBase, sub)
	if err := os.MkdirAll(dstDir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create uploads subdir"})
		return
	}

	// unique filename
	name := NewUniqueFilename(file.Filename)
	dst := filepath.Join(dstDir, name)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	profileImagePath := fmt.Sprintf("/uploads/%s/%s", sub, name)
	user.ProfileImage = profileImagePath
	if err := h.userUsecase.Update(c.Request.Context(), id, user); err != nil {
		// remove file if DB update fails
		_ = os.Remove(dst)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile_image": profileImagePath})
}

// PATCH /users/:id/basic
func (h *UserHandler) UpdateBasicProfile(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Bio      string `json:"bio"` // เพิ่ม bio
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and email are required"})
		return
	}

	// ตรวจสอบ email ซ้ำ
	if exist, _ := h.userUsecase.GetByEmail(c.Request.Context(), req.Email); exist != nil {
		// อนุญาตถ้าเป็นของ user เดิม
		if fmt.Sprintf("%d", exist.UserID) != id {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
			return
		}
	}

	if err := h.userUsecase.UpdateBasic(c.Request.Context(), id, req.Username, req.Email, req.Bio); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	// ส่งข้อมูลล่าสุดกลับ
	updated, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil || updated == nil {
		c.JSON(http.StatusOK, gin.H{"message": "updated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":       updated.UserID,
		"username":      updated.Username,
		"email":         updated.Email,
		"role":          updated.Role,
		"profile_image": updated.ProfileImage,
		"bio":           updated.Bio, // ensure ส่ง bio กลับ
		"created_at":    updated.CreatedAt,
		// ...existing fields ถ้ามี...
	})
}

// PUT /users/:id/password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new_password is required"})
		return
	}

	// ตรวจสอบ current password ถ้ามี
	user, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if req.CurrentPassword != "" && user.Password != "" && user.Password != req.CurrentPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "current password is incorrect"})
		return
	}

	if err := h.userUsecase.UpdatePassword(c.Request.Context(), id, req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to change password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

// PATCH /users/:id/suspend
func (h *UserHandler) SuspendUser(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Suspend bool `json:"suspend"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	user, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	user.IsSuspended = req.Suspend
	err = h.userUsecase.Update(c.Request.Context(), id, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User suspension updated", "is_suspended": user.IsSuspended})
}

// GET /users/find?email=xxx
func (h *UserHandler) FindByEmail(c *gin.Context) {
	email := strings.TrimSpace(c.Query("email"))
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}
	user, err := h.userUsecase.GetByEmail(c.Request.Context(), email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var organizerID int
	h.db.Table("organizers").Select("organizer_id").Where("user_id = ?", user.UserID).Scan(&organizerID)

	c.JSON(http.StatusOK, gin.H{
		"user_id":       user.UserID,
		"username":      user.Username,
		"email":         user.Email,
		"role":          user.Role,
		"organizer_id":  organizerID,
		"first_name":    user.FirstName,
		"last_name":     user.LastName,
		"phone":         user.Phone,
		"bio":           user.Bio,
		"profile_image": user.ProfileImage,
		"is_suspended":  user.IsSuspended,
	})
}
