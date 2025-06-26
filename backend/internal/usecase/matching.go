package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type MatchingUsecase struct {
	matchingRepo repository.MatchingRepository
}

func NewMatchingUsecase(matchingRepo repository.MatchingRepository) *MatchingUsecase {
	return &MatchingUsecase{matchingRepo: matchingRepo}
}

func (u *MatchingUsecase) Create(ctx context.Context, matching *entity.Matching) error {
	return u.matchingRepo.Create(ctx, matching)
}

func (u *MatchingUsecase) GetByID(ctx context.Context, id string) (*entity.Matching, error) {
	return u.matchingRepo.GetByID(ctx, id)
}

func (u *MatchingUsecase) Update(ctx context.Context, matching *entity.Matching) error {
	return u.matchingRepo.Update(ctx, matching)
}

func (u *MatchingUsecase) Delete(ctx context.Context, id string) error {
	return u.matchingRepo.Delete(ctx, id)
}

func (u *MatchingUsecase) GetAll(ctx context.Context) ([]entity.Matching, error) {
	return u.matchingRepo.GetAll(ctx)
}
