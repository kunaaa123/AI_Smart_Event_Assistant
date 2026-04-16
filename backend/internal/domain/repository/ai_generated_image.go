package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type AIGeneratedImageRepository interface {
	Create(ctx context.Context, image *entity.AIGeneratedImage) error
	GetByUserAndType(ctx context.Context, userID uint, imageType string) ([]*entity.AIGeneratedImage, error)
	GetByAlbumID(ctx context.Context, albumID string) ([]*entity.AIGeneratedImage, error)
	Delete(ctx context.Context, id uint, userID uint) error
	DeleteByAlbumID(ctx context.Context, albumID string, userID uint) error
	GetUserImageCount(ctx context.Context, userID uint, imageType string) (int64, error)
}
