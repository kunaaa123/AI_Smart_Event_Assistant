package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type EventRepository interface {
	Create(ctx context.Context, event *entity.Event) error
	GetByID(ctx context.Context, id string) (*entity.Event, error)
	Update(ctx context.Context, event *entity.Event) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.Event, error)
}
