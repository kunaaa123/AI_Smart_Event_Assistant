package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type MatchingRepository interface {
	Create(ctx context.Context, matching *entity.Matching) error
	GetByID(ctx context.Context, id string) (*entity.Matching, error)
	Update(ctx context.Context, matching *entity.Matching) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.Matching, error)
}
