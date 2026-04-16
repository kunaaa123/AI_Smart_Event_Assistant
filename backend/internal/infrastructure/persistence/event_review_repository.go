package persistence

import (
	"context"

	"gorm.io/gorm"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type MySQLEventReviewRepository struct {
	db *gorm.DB
}

func NewMySQLEventReviewRepository(db *gorm.DB) *MySQLEventReviewRepository {
	return &MySQLEventReviewRepository{db: db}
}

func (r *MySQLEventReviewRepository) Create(ctx context.Context, review *entity.EventReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *MySQLEventReviewRepository) GetByEventID(ctx context.Context, eventID int) ([]entity.EventReview, error) {
	var reviews []entity.EventReview
	err := r.db.WithContext(ctx).
		Where("event_id = ?", eventID).
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}

func (r *MySQLEventReviewRepository) GetAvgRating(ctx context.Context, eventID int) (float64, int, error) {
	type agg struct {
		Avg   float64 `gorm:"column:avg_rating"`
		Total int     `gorm:"column:total_reviews"`
	}
	var a agg
	if err := r.db.WithContext(ctx).
		Model(&entity.EventReview{}).
		Select("COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews").
		Where("event_id = ?", eventID).
		Scan(&a).Error; err != nil {
		return 0, 0, err
	}
	return a.Avg, a.Total, nil
}

func (r *MySQLEventReviewRepository) GetByUserID(ctx context.Context, userID int) ([]entity.EventReview, error) {
	var reviews []entity.EventReview
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}

func (r *MySQLEventReviewRepository) Update(ctx context.Context, review *entity.EventReview) error {
	return r.db.WithContext(ctx).
		Model(&entity.EventReview{}).
		Where("review_id = ?", review.ReviewID).
		Updates(map[string]interface{}{
			"rating":  review.Rating,
			"comment": review.Comment,
		}).Error
}

func (r *MySQLEventReviewRepository) Delete(ctx context.Context, reviewID int) error {
	return r.db.WithContext(ctx).
		Where("review_id = ?", reviewID).
		Delete(&entity.EventReview{}).Error
}

func (r *MySQLEventReviewRepository) GetAll(ctx context.Context) ([]entity.EventReview, error) {
	var reviews []entity.EventReview
	err := r.db.WithContext(ctx).
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}
