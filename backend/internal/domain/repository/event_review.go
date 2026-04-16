package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type EventReviewRepository interface {
	Create(ctx context.Context, review *entity.EventReview) error
	GetByEventID(ctx context.Context, eventID int) ([]entity.EventReview, error)
	// ต้องมีเมธอดนี้
	GetAvgRating(ctx context.Context, eventID int) (float64, int, error)
	GetByUserID(ctx context.Context, userID int) ([]entity.EventReview, error)
	Update(ctx context.Context, review *entity.EventReview) error
	// ใช้ int ให้ตรงกับที่เรียกใช้
	Delete(ctx context.Context, reviewID int) error
	// สำหรับหน้าแอดมิน
	GetAll(ctx context.Context) ([]entity.EventReview, error)
}
