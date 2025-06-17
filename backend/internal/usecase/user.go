package usecase

import (
	"context"
	"errors"
	"fmt"
	"strconv"

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
	// แปลง string ID เป็น int
	userID, err := strconv.Atoi(id)
	if err != nil {
		return fmt.Errorf("invalid user ID: %v", err)
	}

	// เรียกใช้ GetByID ด้วย string
	existingUser, err := uc.userRepo.GetByID(ctx, strconv.Itoa(userID))
	if err != nil {
		return err
	}
	if existingUser == nil {
		return errors.New("user not found")
	}

	// อัพเดทข้อมูล
	user.UserID = userID // ให้แน่ใจว่าใช้ ID เดิม
	return uc.userRepo.Update(ctx, user)
}

func (u *UserUsecase) Delete(ctx context.Context, id string) error {
	return u.userRepo.Delete(ctx, id)
}

func (u *UserUsecase) GetAll(ctx context.Context) ([]entity.User, error) {
	return u.userRepo.GetAll(ctx)
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
