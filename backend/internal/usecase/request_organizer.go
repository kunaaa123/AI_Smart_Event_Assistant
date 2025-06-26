package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type RequestOrganizerUsecase struct {
	repo repository.RequestOrganizerRepository
}

func NewRequestOrganizerUsecase(repo repository.RequestOrganizerRepository) *RequestOrganizerUsecase {
	return &RequestOrganizerUsecase{repo: repo}
}

func (u *RequestOrganizerUsecase) Create(ctx context.Context, req *entity.RequestOrganizer) error {
	return u.repo.Create(ctx, req)
}

func (u *RequestOrganizerUsecase) GetByID(ctx context.Context, id string) (*entity.RequestOrganizer, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *RequestOrganizerUsecase) Update(ctx context.Context, req *entity.RequestOrganizer) error {
	return u.repo.Update(ctx, req)
}

func (u *RequestOrganizerUsecase) Delete(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

func (u *RequestOrganizerUsecase) GetAll(ctx context.Context) ([]entity.RequestOrganizer, error) {
	return u.repo.GetAll(ctx)
}
