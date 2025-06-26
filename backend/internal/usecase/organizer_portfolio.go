package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type OrganizerPortfolioUsecase struct {
	repo repository.OrganizerPortfolioRepository
}

func NewOrganizerPortfolioUsecase(repo repository.OrganizerPortfolioRepository) *OrganizerPortfolioUsecase {
	return &OrganizerPortfolioUsecase{repo: repo}
}

func (u *OrganizerPortfolioUsecase) Create(ctx context.Context, portfolio *entity.OrganizerPortfolio) error {
	return u.repo.Create(ctx, portfolio)
}

func (u *OrganizerPortfolioUsecase) GetByID(ctx context.Context, id string) (*entity.OrganizerPortfolio, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *OrganizerPortfolioUsecase) Update(ctx context.Context, portfolio *entity.OrganizerPortfolio) error {
	return u.repo.Update(ctx, portfolio)
}

func (u *OrganizerPortfolioUsecase) Delete(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

func (u *OrganizerPortfolioUsecase) GetAll(ctx context.Context) ([]entity.OrganizerPortfolio, error) {
	return u.repo.GetAll(ctx)
}

func (u *OrganizerPortfolioUsecase) GetByOrganizerID(ctx context.Context, organizerID string) ([]entity.OrganizerPortfolio, error) {
	return u.repo.GetByOrganizerID(ctx, organizerID)
}
