package persistence

import (
	"context"
	"fmt"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlFavoriteRepository struct {
	db *gorm.DB
}

func NewMySQLFavoriteRepository(db *gorm.DB) repository.FavoriteRepository {
	return &mysqlFavoriteRepository{db: db}
}

func (r *mysqlFavoriteRepository) Create(ctx context.Context, favorite *entity.Favorite) error {
	return r.db.WithContext(ctx).Create(favorite).Error
}

func (r *mysqlFavoriteRepository) Delete(ctx context.Context, userID, eventID int) error {
	return r.db.WithContext(ctx).Where("user_id = ? AND event_id = ?", userID, eventID).Delete(&entity.Favorite{}).Error
}

func (r *mysqlFavoriteRepository) GetByUserID(ctx context.Context, userID int) ([]entity.Favorite, error) {
	var favorites []entity.Favorite
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&favorites).Error
	return favorites, err
}

func (r *mysqlFavoriteRepository) CheckExists(ctx context.Context, userID, eventID int) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Favorite{}).Where("user_id = ? AND event_id = ?", userID, eventID).Count(&count).Error
	return count > 0, err
}

func (r *mysqlFavoriteRepository) GetFavoriteWithEvent(ctx context.Context, userID int) ([]entity.Favorite, error) {
	var favorites []entity.Favorite
	err := r.db.WithContext(ctx).
		Preload("Event").
		Preload("User").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&favorites).Error

	// Debug: ตรวจสอบข้อมูลที่ได้
	for i, fav := range favorites {
		fmt.Printf("[DEBUG] Favorite %d: favorite_id=%d, user_id=%d, event_id=%d\n",
			i, fav.FavoriteID, fav.UserID, fav.EventID)
		if fav.Event.EventID != 0 {
			fmt.Printf("[DEBUG] Event data: event_id=%d, name=%s\n",
				fav.Event.EventID, fav.Event.Name)
		} else {
			fmt.Printf("[DEBUG] Event data is empty!\n")
		}
	}

	return favorites, err
}
