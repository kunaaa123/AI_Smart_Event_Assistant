package persistence

import (
	"context"
	"strconv"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlVenueReviewRepository struct {
	db *gorm.DB
}

func NewMySQLVenueReviewRepository(db *gorm.DB) repository.VenueReviewRepository {
	return &mysqlVenueReviewRepository{db: db}
}

func (r *mysqlVenueReviewRepository) Create(ctx context.Context, rv *entity.VenueReview) error {
	return r.db.WithContext(ctx).Create(rv).Error
}

func (r *mysqlVenueReviewRepository) GetByVenueID(ctx context.Context, venueID string) ([]entity.VenueReview, error) {
	var reviews []entity.VenueReview
	id, err := strconv.Atoi(venueID)
	if err != nil {
		return nil, err
	}
	result := r.db.WithContext(ctx).
		Where("venue_id = ?", id).
		Order("created_at DESC").
		Find(&reviews)
	return reviews, result.Error
}
