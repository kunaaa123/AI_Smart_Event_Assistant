package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type EventImageUsecase struct {
	repo repository.EventImageRepository
}

func NewEventImageUsecase(repo repository.EventImageRepository) *EventImageUsecase {
	return &EventImageUsecase{repo: repo}
}

func (u *EventImageUsecase) Create(ctx context.Context, img *entity.EventImage) error {
	return u.repo.Create(ctx, img)
}

func (u *EventImageUsecase) GetByEventID(ctx context.Context, eventID int) ([]entity.EventImage, error) {
	return u.repo.GetByEventID(ctx, eventID)
}

func (u *EventImageUsecase) Delete(ctx context.Context, imageID int) error {
	return u.repo.Delete(ctx, imageID)
}
