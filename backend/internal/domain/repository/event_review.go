package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type EventReviewRepository interface {
	Create(ctx context.Context, review *entity.EventReview) error
	GetByEventID(ctx context.Context, eventID int) ([]entity.EventReview, error)
	GetAvgRating(ctx context.Context, eventID int) (float64, int, error)
}
