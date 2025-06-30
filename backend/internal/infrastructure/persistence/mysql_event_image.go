package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"gorm.io/gorm"
)

type mysqlEventImageRepository struct {
	db *gorm.DB
}

func NewMySQLEventImageRepository(db *gorm.DB) *mysqlEventImageRepository {
	return &mysqlEventImageRepository{db}
}

func (r *mysqlEventImageRepository) Create(ctx context.Context, img *entity.EventImage) error {
	return r.db.WithContext(ctx).Create(img).Error
}

func (r *mysqlEventImageRepository) GetByEventID(ctx context.Context, eventID int) ([]entity.EventImage, error) {
	var imgs []entity.EventImage
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Find(&imgs).Error
	return imgs, err
}

func (r *mysqlEventImageRepository) Delete(ctx context.Context, imageID int) error {
	return r.db.WithContext(ctx).Delete(&entity.EventImage{}, imageID).Error
}
