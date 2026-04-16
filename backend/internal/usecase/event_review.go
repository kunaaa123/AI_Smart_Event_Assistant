package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type EventReviewUsecase struct {
	repo repository.EventReviewRepository
}

func NewEventReviewUsecase(repo repository.EventReviewRepository) *EventReviewUsecase {
	if repo == nil {
		panic("EventReviewRepository cannot be nil")
	}
	return &EventReviewUsecase{repo: repo}
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

func (u *EventReviewUsecase) GetByUserID(ctx context.Context, userID int) ([]entity.EventReview, error) {
	return u.repo.GetByUserID(ctx, userID)
}

func (u *EventReviewUsecase) Update(ctx context.Context, review *entity.EventReview) error {
	return u.repo.Update(ctx, review)
}

func (u *EventReviewUsecase) Delete(ctx context.Context, reviewID int) error {
	return u.repo.Delete(ctx, reviewID)
}

func (u *EventReviewUsecase) GetAll(ctx context.Context) ([]entity.EventReview, error) {
	return u.repo.GetAll(ctx)
}
