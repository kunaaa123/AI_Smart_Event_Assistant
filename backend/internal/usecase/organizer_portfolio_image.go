package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type OrganizerPortfolioImageUsecase struct {
	repo repository.OrganizerPortfolioImageRepository
}

func NewOrganizerPortfolioImageUsecase(repo repository.OrganizerPortfolioImageRepository) *OrganizerPortfolioImageUsecase {
	return &OrganizerPortfolioImageUsecase{repo: repo}
}

func (u *OrganizerPortfolioImageUsecase) Create(ctx context.Context, img *entity.OrganizerPortfolioImage) error {
	return u.repo.Create(ctx, img)
}

func (u *OrganizerPortfolioImageUsecase) GetByPortfolioID(ctx context.Context, portfolioID int) ([]entity.OrganizerPortfolioImage, error) {
	return u.repo.GetByPortfolioID(ctx, portfolioID)
}

func (u *OrganizerPortfolioImageUsecase) Delete(ctx context.Context, imageID int) error {
	return u.repo.Delete(ctx, imageID)
}
