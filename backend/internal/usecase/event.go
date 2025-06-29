package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type EventUsecase struct {
	eventRepo repository.EventRepository
}

func NewEventUsecase(eventRepo repository.EventRepository) *EventUsecase {
	return &EventUsecase{eventRepo: eventRepo}
}

func (u *EventUsecase) Create(ctx context.Context, event *entity.Event) error {
	return u.eventRepo.Create(ctx, event)
}

func (u *EventUsecase) GetByID(ctx context.Context, id string) (*entity.Event, error) {
	return u.eventRepo.GetByID(ctx, id)
}

func (u *EventUsecase) Update(ctx context.Context, event *entity.Event) error {
	return u.eventRepo.Update(ctx, event)
}

func (u *EventUsecase) Delete(ctx context.Context, id string) error {
	return u.eventRepo.Delete(ctx, id)
}

func (u *EventUsecase) GetAll(ctx context.Context) ([]entity.Event, error) {
	return u.eventRepo.GetAll(ctx)
}

func (u *EventUsecase) GetByUserID(ctx context.Context, userID string) ([]entity.Event, error) {
	return u.eventRepo.GetByUserID(ctx, userID)
}
