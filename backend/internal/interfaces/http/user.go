package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity" // แก้ path
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

	user := entity.NewUser(req.Username, req.Email, req.Password)
	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = req.Phone
	user.Bio = req.Bio

	err := h.userUsecase.Create(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Register successful",
		"user":    user,
	})
}

func (h *UserHandler) RegisterRoutes(router *gin.Engine) {
	// เพิ่ม route group
	users := router.Group("/users")
	{
		users.POST("/register", h.Register)                    // เพิ่ม route สมัครสมาชิก
		users.GET("", h.GetAllUsers)                           // เพิ่ม route สำหรับดึงข้อมูลทั้งหมด
		users.GET("/:id", h.GetUser)                           // ดึงข้อมูล user คนเดียว
		users.POST("", h.CreateUser)                           // สร้าง user
		users.PUT("/:id", h.UpdateUser)                        // อัพเดท user
		users.DELETE("/:id", h.DeleteUser)                     // ลบ user
		users.POST("/:id/profile-image", h.UploadProfileImage) // <<--- เพิ่มบรรทัดนี้
	}
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

	filename := fmt.Sprintf("profile_%s_%s", id, file.Filename)
	dst := fmt.Sprintf("./uploads/%s", filename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// อัปเดต path ใน DB
	profileImagePath := "/uploads/" + filename
	user.ProfileImage = &profileImagePath
	if err := h.userUsecase.Update(c.Request.Context(), id, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile_image": profileImagePath})
}
