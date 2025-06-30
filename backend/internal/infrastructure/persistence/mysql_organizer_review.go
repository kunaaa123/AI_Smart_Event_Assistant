package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlOrganizerReviewRepository struct {
	db *gorm.DB
}

func NewMySQLOrganizerReviewRepository(db *gorm.DB) repository.OrganizerReviewRepository {
	return &mysqlOrganizerReviewRepository{db}
}

func (r *mysqlOrganizerReviewRepository) Create(ctx context.Context, review *entity.OrganizerReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *mysqlOrganizerReviewRepository) GetByOrganizerID(ctx context.Context, organizerID int) ([]entity.OrganizerReview, error) {
	var reviews []entity.OrganizerReview
	err := r.db.WithContext(ctx).Where("organizer_id = ?", organizerID).Order("created_at desc").Find(&reviews).Error
	return reviews, err
}

func (r *mysqlOrganizerReviewRepository) GetAvgRating(ctx context.Context, organizerID int) (float64, int, error) {
	var avg float64
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.OrganizerReview{}).
		Where("organizer_id = ?", organizerID).
		Count(&count).
		Select("AVG(rating)").Row().Scan(&avg)
	return avg, int(count), err
}
