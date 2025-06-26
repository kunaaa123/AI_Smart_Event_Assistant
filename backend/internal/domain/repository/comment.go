package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type CommentRepository interface {
	Create(ctx context.Context, comment *entity.Comment) error
	GetByID(ctx context.Context, id string) (*entity.Comment, error)
	Update(ctx context.Context, comment *entity.Comment) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.Comment, error)
}
