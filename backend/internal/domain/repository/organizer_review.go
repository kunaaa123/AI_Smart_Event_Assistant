package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type OrganizerReviewRepository interface {
	Create(ctx context.Context, review *entity.OrganizerReview) error
	GetByOrganizerID(ctx context.Context, organizerID int) ([]entity.OrganizerReview, error)
	GetAvgRating(ctx context.Context, organizerID int) (float64, int, error)
	GetByUserID(ctx context.Context, userID int) ([]entity.OrganizerReview, error)
	Update(ctx context.Context, review *entity.OrganizerReview) error
	Delete(ctx context.Context, reviewID int) error
	// เพิ่มเมธอดดึงทั้งหมดสำหรับหน้าแอดมิน
	GetAll(ctx context.Context) ([]entity.OrganizerReview, error)
}
