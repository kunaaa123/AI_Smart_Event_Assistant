package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type OrganizerPortfolioRepository interface {
	Create(ctx context.Context, portfolio *entity.OrganizerPortfolio) error
	GetByID(ctx context.Context, id string) (*entity.OrganizerPortfolio, error)
	Update(ctx context.Context, portfolio *entity.OrganizerPortfolio) error
	Delete(ctx context.Context, id string) error
	GetAll(ctx context.Context) ([]entity.OrganizerPortfolio, error)
	GetByOrganizerID(ctx context.Context, organizerID string) ([]entity.OrganizerPortfolio, error)
}
