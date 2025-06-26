package usecase

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type UserUsecase struct {
	userRepo repository.UserRepository
}

func NewUserUsecase(userRepo repository.UserRepository) *UserUsecase {
	return &UserUsecase{
		userRepo: userRepo,
	}
}

func (u *UserUsecase) Create(ctx context.Context, user *entity.User) error {
	return u.userRepo.Create(ctx, user)
}

func (u *UserUsecase) GetByID(ctx context.Context, id string) (*entity.User, error) {
	return u.userRepo.GetByID(ctx, id)
}

func (uc *UserUsecase) Update(ctx context.Context, id string, user *entity.User) error {
	userID, err := strconv.Atoi(id)
	if err != nil {
		return fmt.Errorf("invalid user ID: %v", err)
	}
	user.UserID = userID // สำคัญ!
	return uc.userRepo.Update(ctx, user)
}

func (u *UserUsecase) Delete(ctx context.Context, id string) error {
	return u.userRepo.Delete(ctx, id)
}

func (u *UserUsecase) GetAll(ctx context.Context) ([]entity.User, error) {
	return u.userRepo.GetAll(ctx)
}

func (u *UserUsecase) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	return u.userRepo.GetByEmail(ctx, email)
}

// MySQL implementation
type mysqlUserRepository struct {
	db *gorm.DB
}

func (r *mysqlUserRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	var user entity.User
	result := r.db.WithContext(ctx).First(&user, "user_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

type UserHandler struct {
	userUsecase *UserUsecase
}

func NewUserHandler(userUsecase *UserUsecase) *UserHandler {
	return &UserHandler{
		userUsecase: userUsecase,
	}
}

func (h *UserHandler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
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
	err := h.userUsecase.Create(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Register successful",
		"user": gin.H{
			"user_id":  user.UserID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var updatedUser entity.User
	if err := c.ShouldBindJSON(&updatedUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เพิ่มตรงนี้!
	fmt.Println("first_name:", updatedUser.FirstName)
	fmt.Println("last_name:", updatedUser.LastName)

	existingUser, err := h.userUsecase.GetByID(c.Request.Context(), id)
	if err != nil || existingUser == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// อัปเดตเฉพาะฟิลด์ที่อนุญาต
	existingUser.FirstName = updatedUser.FirstName
	existingUser.LastName = updatedUser.LastName
	existingUser.Phone = updatedUser.Phone
	existingUser.Bio = updatedUser.Bio
	existingUser.Email = updatedUser.Email // ถ้าอนุญาตให้แก้ไข

	// ไม่อัปเดต role, username, password ตรงนี้

	err = h.userUsecase.Update(c.Request.Context(), id, existingUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    existingUser,
	})
}

func RegisterRoutes(r *gin.Engine, h *UserHandler) {
	users := r.Group("/users")
	{
		users.POST("/register", h.Register) // ถูกต้องแล้ว
	}
}
