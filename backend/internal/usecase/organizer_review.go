package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type OrganizerReviewUsecase struct {
	repo repository.OrganizerReviewRepository
}

func NewOrganizerReviewUsecase(r repository.OrganizerReviewRepository) *OrganizerReviewUsecase {
	return &OrganizerReviewUsecase{repo: r}
}

func (u *OrganizerReviewUsecase) Create(ctx context.Context, review *entity.OrganizerReview) error {
	return u.repo.Create(ctx, review)
}

func (u *OrganizerReviewUsecase) GetByOrganizerID(ctx context.Context, organizerID int) ([]entity.OrganizerReview, error) {
	return u.repo.GetByOrganizerID(ctx, organizerID)
}

func (u *OrganizerReviewUsecase) GetAvgRating(ctx context.Context, organizerID int) (float64, int, error) {
	return u.repo.GetAvgRating(ctx, organizerID)
}
