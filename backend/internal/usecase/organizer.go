package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type OrganizerUsecase struct {
	organizerRepo repository.OrganizerRepository
}

func NewOrganizerUsecase(organizerRepo repository.OrganizerRepository) *OrganizerUsecase {
	return &OrganizerUsecase{organizerRepo: organizerRepo}
}

func (u *OrganizerUsecase) Create(ctx context.Context, organizer *entity.Organizer) error {
	return u.organizerRepo.Create(ctx, organizer)
}

func (u *OrganizerUsecase) GetByID(ctx context.Context, id string) (*entity.Organizer, error) {
	return u.organizerRepo.GetByID(ctx, id)
}

func (u *OrganizerUsecase) Update(ctx context.Context, organizer *entity.Organizer) error {
	return u.organizerRepo.Update(ctx, organizer)
}

func (u *OrganizerUsecase) Delete(ctx context.Context, id string) error {
	return u.organizerRepo.Delete(ctx, id)
}

func (u *OrganizerUsecase) GetAll(ctx context.Context) ([]entity.Organizer, error) {
	return u.organizerRepo.GetAll(ctx)
}

func (u *OrganizerUsecase) GetAllWithName(ctx context.Context, out *[]entity.OrganizerWithName) error {
	return u.organizerRepo.GetAllWithName(ctx, out)
}
