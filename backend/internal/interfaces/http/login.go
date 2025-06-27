package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type LoginHandler struct {
	userUsecase *usecase.UserUsecase
	db          *gorm.DB
}

func NewLoginHandler(uc *usecase.UserUsecase, db *gorm.DB) *LoginHandler {
	return &LoginHandler{userUsecase: uc, db: db}
}

func (h *LoginHandler) RegisterRoutes(router *gin.Engine) {
	router.POST("/login", h.Login)
}

func (h *LoginHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, err := h.userUsecase.GetByEmail(c.Request.Context(), req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email or password incorrect"})
		return
	}
	if user.Password != req.Password { // *ควร hash password จริงๆ*
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email or password incorrect"})
		return
	}

	// หลังจากดึง user ได้แล้ว
	var organizerID int
	h.db.Table("organizers").Select("organizer_id").Where("user_id = ?", user.UserID).Scan(&organizerID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": gin.H{
			"user_id":      user.UserID,
			"username":     user.Username,
			"email":        user.Email,
			"role":         user.Role,
			"organizer_id": organizerID, // เพิ่มตรงนี้
			// ...field อื่นๆ
		},
	})
}
