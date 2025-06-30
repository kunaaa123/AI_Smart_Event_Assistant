package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type OrganizerPortfolioImageRepository interface {
	Create(ctx context.Context, img *entity.OrganizerPortfolioImage) error
	GetByPortfolioID(ctx context.Context, portfolioID int) ([]entity.OrganizerPortfolioImage, error)
	Delete(ctx context.Context, imageID int) error
}
