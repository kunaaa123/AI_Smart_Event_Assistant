package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type VenueRepository interface {
	GetAll(ctx context.Context) ([]entity.Venue, error)
	GetByID(ctx context.Context, id string) (*entity.Venue, error)
	GetPopular(ctx context.Context, limit int) ([]entity.Venue, error)
	Create(ctx context.Context, venue *entity.Venue) error
	Update(ctx context.Context, venue *entity.Venue) error
	Delete(ctx context.Context, id string) error
}

type VenueImageRepository interface {
	GetByVenueID(ctx context.Context, venueID string) ([]entity.VenueImage, error)
	Create(ctx context.Context, image *entity.VenueImage) error
	Delete(ctx context.Context, imageID string) error
}
