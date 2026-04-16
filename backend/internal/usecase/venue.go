package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type VenueUsecase struct {
	venueRepo repository.VenueRepository
}

func NewVenueUsecase(venueRepo repository.VenueRepository) *VenueUsecase {
	return &VenueUsecase{
		venueRepo: venueRepo,
	}
}

func (u *VenueUsecase) GetAll(ctx context.Context) ([]entity.Venue, error) {
	return u.venueRepo.GetAll(ctx)
}

func (u *VenueUsecase) GetByID(ctx context.Context, id string) (*entity.Venue, error) {
	return u.venueRepo.GetByID(ctx, id)
}

func (u *VenueUsecase) GetPopular(ctx context.Context, limit int) ([]entity.Venue, error) {
	if limit <= 0 {
		limit = 6 // default limit
	}
	return u.venueRepo.GetPopular(ctx, limit)
}

func (u *VenueUsecase) Create(ctx context.Context, venue *entity.Venue) error {
	return u.venueRepo.Create(ctx, venue)
}

func (u *VenueUsecase) Update(ctx context.Context, venue *entity.Venue) error {
	return u.venueRepo.Update(ctx, venue)
}

func (u *VenueUsecase) Delete(ctx context.Context, id string) error {
	return u.venueRepo.Delete(ctx, id)
}

type VenueImageUsecase struct {
	venueImageRepo repository.VenueImageRepository
}

func NewVenueImageUsecase(venueImageRepo repository.VenueImageRepository) *VenueImageUsecase {
	return &VenueImageUsecase{
		venueImageRepo: venueImageRepo,
	}
}

func (u *VenueImageUsecase) GetByVenueID(ctx context.Context, venueID string) ([]entity.VenueImage, error) {
	return u.venueImageRepo.GetByVenueID(ctx, venueID)
}

func (u *VenueImageUsecase) Create(ctx context.Context, image *entity.VenueImage) error {
	return u.venueImageRepo.Create(ctx, image)
}

func (u *VenueImageUsecase) Delete(ctx context.Context, imageID string) error {
	return u.venueImageRepo.Delete(ctx, imageID)
}
