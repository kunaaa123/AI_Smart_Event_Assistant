package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type FavoriteRepository interface {
	Create(ctx context.Context, favorite *entity.Favorite) error
	GetByID(ctx context.Context, id string) (*entity.Favorite, error)
	Update(ctx context.Context, favorite *entity.Favorite) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.Favorite, error)
}
