package persistence

import (
	"context"
	"errors"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlUserRepository struct {
	db *gorm.DB
}

func NewMySQLUserRepository(db *gorm.DB) repository.UserRepository {
	return &mysqlUserRepository{db: db}
}

func (r *mysqlUserRepository) Create(ctx context.Context, user *entity.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *mysqlUserRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	var user entity.User
	result := r.db.WithContext(ctx).First(&user, "user_id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *mysqlUserRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	var user entity.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // ไม่เจอ user = ไม่ error
		}
		return nil, err // error อื่นๆ
	}
	return &user, nil
}

func (r *mysqlUserRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&entity.User{}, "user_id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *mysqlUserRepository) GetByUsername(ctx context.Context, username string) (*entity.User, error) {
	var user entity.User
	result := r.db.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *mysqlUserRepository) Update(ctx context.Context, user *entity.User) error {
	// ไม่อัพเดท created_at
	result := r.db.WithContext(ctx).Model(&entity.User{}).
		Where("user_id = ?", user.UserID).
		Updates(map[string]interface{}{
			"username":      user.Username,
			"email":         user.Email,
			"password":      user.Password,
			"role":          user.Role,
			"profile_image": user.ProfileImage,
		})

	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *mysqlUserRepository) GetAll(ctx context.Context) ([]entity.User, error) {
	var users []entity.User
	result := r.db.Find(&users)
	return users, result.Error
}

// implement method อื่นๆ ตาม interface
