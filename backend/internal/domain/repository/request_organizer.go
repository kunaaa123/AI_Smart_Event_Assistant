package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type RequestOrganizerRepository interface {
	Create(ctx context.Context, req *entity.RequestOrganizer) error
	GetByID(ctx context.Context, id string) (*entity.RequestOrganizer, error)
	Update(ctx context.Context, req *entity.RequestOrganizer) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.RequestOrganizer, error)
}
