package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlEventReviewRepository struct {
	db *gorm.DB
}

func NewMySQLEventReviewRepository(db *gorm.DB) repository.EventReviewRepository {
	return &mysqlEventReviewRepository{db}
}

func (r *mysqlEventReviewRepository) Create(ctx context.Context, review *entity.EventReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *mysqlEventReviewRepository) GetByEventID(ctx context.Context, eventID int) ([]entity.EventReview, error) {
	var reviews []entity.EventReview
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Order("created_at desc").Find(&reviews).Error
	return reviews, err
}

func (r *mysqlEventReviewRepository) GetAvgRating(ctx context.Context, eventID int) (float64, int, error) {
	var avg float64
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.EventReview{}).
		Where("event_id = ?", eventID).
		Count(&count).
		Select("AVG(rating)").Row().Scan(&avg)
	return avg, int(count), err
}
