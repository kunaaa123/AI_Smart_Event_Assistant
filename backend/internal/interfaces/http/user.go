package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity" // แก้ path
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type UserHandler struct {
	userUsecase *usecase.UserUsecase // Note the case
}

func NewUserHandler(uc *usecase.UserUsecase) *UserHandler {
	return &UserHandler{
		userUsecase: uc,
	}
}

func (h *UserHandler) Register(c *gin.Context) {
	// Handle HTTP request
}

func (h *UserHandler) RegisterRoutes(router *gin.Engine) {
	// เพิ่ม route group
	users := router.Group("/users")
	{
		users.GET("", h.GetAllUsers)       // เพิ่ม route สำหรับดึงข้อมูลทั้งหมด
		users.GET("/:id", h.GetUser)       // ดึงข้อมูล user คนเดียว
		users.POST("", h.CreateUser)       // สร้าง user
		users.PUT("/:id", h.UpdateUser)    // อัพเดท user
		users.DELETE("/:id", h.DeleteUser) // ลบ user
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
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	// รับ ID จาก URL parameter
	id := c.Param("id")

	// สร้าง struct เพื่อรับข้อมูลที่จะอัพเดท
	var updatedUser entity.User
	if err := c.ShouldBindJSON(&updatedUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เรียกใช้ usecase เพื่ออัพเดทข้อมูล
	err := h.userUsecase.Update(c.Request.Context(), id, &updatedUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    updatedUser,
	})
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
