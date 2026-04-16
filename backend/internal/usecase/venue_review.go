package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type VenueReviewUsecase struct {
	repo repository.VenueReviewRepository
}

func NewVenueReviewUsecase(repo repository.VenueReviewRepository) *VenueReviewUsecase {
	return &VenueReviewUsecase{repo: repo}
}

func (u *VenueReviewUsecase) Create(ctx context.Context, rv *entity.VenueReview) error {
	if rv == nil {
		return errors.New("nil review")
	}
	if rv.Rating < 1 || rv.Rating > 5 {
		return errors.New("rating must be between 1 and 5")
	}
	rv.Comment = strings.TrimSpace(rv.Comment)
	if rv.Comment == "" {
		return errors.New("comment is required")
	}
	return u.repo.Create(ctx, rv)
}

func (u *VenueReviewUsecase) GetByVenueID(ctx context.Context, id string) ([]entity.VenueReview, error) {
	return u.repo.GetByVenueID(ctx, id)
}
