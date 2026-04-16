package persistence

import (
	"context"

	"gorm.io/gorm"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type MySQLOrganizerReviewRepository struct {
	db *gorm.DB
}

func NewMySQLOrganizerReviewRepository(db *gorm.DB) *MySQLOrganizerReviewRepository {
	return &MySQLOrganizerReviewRepository{db: db}
}

// สร้างรีวิว
func (r *MySQLOrganizerReviewRepository) Create(ctx context.Context, review *entity.OrganizerReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

// ดึงทั้งหมด (ใช้ในหน้าแอดมิน)
func (r *MySQLOrganizerReviewRepository) GetAll(ctx context.Context) ([]entity.OrganizerReview, error) {
	var reviews []entity.OrganizerReview
	err := r.db.WithContext(ctx).
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}

// ดึงตาม OrganizerID  ← เมธอดที่หาย
func (r *MySQLOrganizerReviewRepository) GetByOrganizerID(ctx context.Context, organizerID int) ([]entity.OrganizerReview, error) {
	var reviews []entity.OrganizerReview
	err := r.db.WithContext(ctx).
		Where("organizer_id = ?", organizerID).
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}

// ค่าเฉลี่ยเรตติ้ง + จำนวนรีวิวของ organizer
func (r *MySQLOrganizerReviewRepository) GetAvgRating(ctx context.Context, organizerID int) (float64, int, error) {
	type agg struct {
		Avg   float64 `gorm:"column:avg_rating"`
		Total int     `gorm:"column:total_reviews"`
	}
	var a agg
	if err := r.db.WithContext(ctx).
		Model(&entity.OrganizerReview{}).
		Select("COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews").
		Where("organizer_id = ?", organizerID).
		Scan(&a).Error; err != nil {
		return 0, 0, err
	}
	return a.Avg, a.Total, nil
}

// ดึงตาม UserID (รีวิวที่ผู้ใช้คนหนึ่งให้กับ organizer ต่างๆ)
func (r *MySQLOrganizerReviewRepository) GetByUserID(ctx context.Context, userID int) ([]entity.OrganizerReview, error) {
	var reviews []entity.OrganizerReview
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&reviews).Error
	return reviews, err
}

// อัปเดตรีวิว
func (r *MySQLOrganizerReviewRepository) Update(ctx context.Context, review *entity.OrganizerReview) error {
	return r.db.WithContext(ctx).
		Model(&entity.OrganizerReview{}).
		Where("review_id = ?", review.ReviewID).
		Updates(map[string]interface{}{
			"rating":  review.Rating,
			"comment": review.Comment,
		}).Error
}

// ลบรีวิว (ใช้ int ให้ตรงกับ interface)
func (r *MySQLOrganizerReviewRepository) Delete(ctx context.Context, reviewID int) error {
	return r.db.WithContext(ctx).
		Where("review_id = ?", reviewID).
		Delete(&entity.OrganizerReview{}).Error
}
