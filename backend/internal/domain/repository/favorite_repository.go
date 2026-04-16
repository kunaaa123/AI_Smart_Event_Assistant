package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type FavoriteRepository interface {
	Create(ctx context.Context, favorite *entity.Favorite) error
	Delete(ctx context.Context, userID, eventID int) error
	GetByUserID(ctx context.Context, userID int) ([]entity.Favorite, error)
	CheckExists(ctx context.Context, userID, eventID int) (bool, error)
	GetFavoriteWithEvent(ctx context.Context, userID int) ([]entity.Favorite, error)
}
