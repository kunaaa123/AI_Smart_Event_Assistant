package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type OrganizerRepository interface {
	Create(ctx context.Context, organizer *entity.Organizer) error
	GetByID(ctx context.Context, id string) (*entity.Organizer, error)
	Update(ctx context.Context, organizer *entity.Organizer) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.Organizer, error)
	GetAllWithName(ctx context.Context, out *[]entity.OrganizerWithName) error
}
