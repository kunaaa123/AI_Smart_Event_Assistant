package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type FavoriteUsecase interface {
	AddToFavorites(ctx context.Context, userID, eventID int) error
	RemoveFromFavorites(ctx context.Context, userID, eventID int) error
	GetUserFavorites(ctx context.Context, userID int) ([]entity.Favorite, error)
	CheckIsFavorite(ctx context.Context, userID, eventID int) (bool, error)
}

type favoriteUsecase struct {
	favoriteRepo repository.FavoriteRepository
}

func NewFavoriteUsecase(favoriteRepo repository.FavoriteRepository) FavoriteUsecase {
	return &favoriteUsecase{
		favoriteRepo: favoriteRepo,
	}
}

func (u *favoriteUsecase) AddToFavorites(ctx context.Context, userID, eventID int) error {
	// ตรวจสอบว่ามีอยู่แล้วหรือไม่
	exists, err := u.favoriteRepo.CheckExists(ctx, userID, eventID)
	if err != nil {
		return err
	}
	if exists {
		return nil // ถ้ามีอยู่แล้วไม่ต้องเพิ่ม
	}

	favorite := &entity.Favorite{
		UserID:  userID,
		EventID: eventID,
	}
	return u.favoriteRepo.Create(ctx, favorite)
}

func (u *favoriteUsecase) RemoveFromFavorites(ctx context.Context, userID, eventID int) error {
	return u.favoriteRepo.Delete(ctx, userID, eventID)
}

func (u *favoriteUsecase) GetUserFavorites(ctx context.Context, userID int) ([]entity.Favorite, error) {
	return u.favoriteRepo.GetFavoriteWithEvent(ctx, userID)
}

func (u *favoriteUsecase) CheckIsFavorite(ctx context.Context, userID, eventID int) (bool, error) {
	return u.favoriteRepo.CheckExists(ctx, userID, eventID)
}
