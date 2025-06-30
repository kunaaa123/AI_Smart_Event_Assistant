package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type OrganizerReviewRepository interface {
	Create(ctx context.Context, review *entity.OrganizerReview) error
	GetByOrganizerID(ctx context.Context, organizerID int) ([]entity.OrganizerReview, error)
	GetAvgRating(ctx context.Context, organizerID int) (float64, int, error)
}
