package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type FavoriteUsecase struct {
	favoriteRepo repository.FavoriteRepository
}

func NewFavoriteUsecase(favoriteRepo repository.FavoriteRepository) *FavoriteUsecase {
	return &FavoriteUsecase{favoriteRepo: favoriteRepo}
}

func (u *FavoriteUsecase) Create(ctx context.Context, favorite *entity.Favorite) error {
	return u.favoriteRepo.Create(ctx, favorite)
}

func (u *FavoriteUsecase) GetByID(ctx context.Context, id string) (*entity.Favorite, error) {
	return u.favoriteRepo.GetByID(ctx, id)
}

func (u *FavoriteUsecase) Update(ctx context.Context, favorite *entity.Favorite) error {
	return u.favoriteRepo.Update(ctx, favorite)
}

func (u *FavoriteUsecase) Delete(ctx context.Context, id string) error {
	return u.favoriteRepo.Delete(ctx, id)
}

func (u *FavoriteUsecase) GetAll(ctx context.Context) ([]entity.Favorite, error) {
	return u.favoriteRepo.GetAll(ctx)
}
