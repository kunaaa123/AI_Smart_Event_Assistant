package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type EventReviewUsecase struct {
	repo repository.EventReviewRepository
}

func NewEventReviewUsecase(r repository.EventReviewRepository) *EventReviewUsecase {
	return &EventReviewUsecase{repo: r}
}

func (u *EventReviewUsecase) Create(ctx context.Context, review *entity.EventReview) error {
	return u.repo.Create(ctx, review)
}

func (u *EventReviewUsecase) GetByEventID(ctx context.Context, eventID int) ([]entity.EventReview, error) {
	return u.repo.GetByEventID(ctx, eventID)
}

func (u *EventReviewUsecase) GetAvgRating(ctx context.Context, eventID int) (float64, int, error) {
	return u.repo.GetAvgRating(ctx, eventID)
}
