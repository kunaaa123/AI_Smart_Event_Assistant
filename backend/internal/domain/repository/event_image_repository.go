package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type EventImageRepository interface {
	Create(ctx context.Context, img *entity.EventImage) error
	GetByEventID(ctx context.Context, eventID int) ([]entity.EventImage, error)
	Delete(ctx context.Context, imageID int) error
}
