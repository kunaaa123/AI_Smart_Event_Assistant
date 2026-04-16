package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type VenueReviewRepository interface {
	Create(ctx context.Context, r *entity.VenueReview) error
	GetByVenueID(ctx context.Context, venueID string) ([]entity.VenueReview, error)
}
