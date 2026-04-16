package usecase

import (
	"context"
	"fmt"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type AIGeneratedImageUsecase struct {
	repo repository.AIGeneratedImageRepository
}

func NewAIGeneratedImageUsecase(repo repository.AIGeneratedImageRepository) *AIGeneratedImageUsecase {
	return &AIGeneratedImageUsecase{repo: repo}
}

func (u *AIGeneratedImageUsecase) SaveImages(ctx context.Context, requests []*entity.AIImageCreateRequest) error {
	for _, req := range requests {
		image := &entity.AIGeneratedImage{
			UserID:          req.UserID,
			ImageType:       req.ImageType,
			Base64Data:      req.Base64Data,
			ImageFile:       req.FilePath, // <-- persist file path (if handler set it)
			Prompt:          req.Prompt,
			VariationNumber: req.VariationNumber,
			IsAlbum:         req.IsAlbum,
			HasReference:    req.HasReference,
		}

		if req.AlbumID != "" {
			image.AlbumID = &req.AlbumID
		}
		if req.EnhancedPrompt != "" {
			image.EnhancedPrompt = &req.EnhancedPrompt
		}
		if req.ModelUsed != "" {
			image.ModelUsed = &req.ModelUsed
		}

		err := u.repo.Create(ctx, image)
		if err != nil {
			return fmt.Errorf("failed to save image: %w", err)
		}
	}

	return nil
}

func (u *AIGeneratedImageUsecase) GetUserImages(ctx context.Context, userID uint, imageType string) ([]*entity.AIImageResponse, error) {
	images, err := u.repo.GetByUserAndType(ctx, userID, imageType)
	if err != nil {
		return nil, fmt.Errorf("failed to get user images: %w", err)
	}

	var responses []*entity.AIImageResponse
	for _, img := range images {
		response := &entity.AIImageResponse{
			ID:              img.ID,
			Base64Data:      img.Base64Data,
			Prompt:          img.Prompt,
			VariationNumber: img.VariationNumber,
			IsAlbum:         img.IsAlbum,
			HasReference:    img.HasReference,
			CreatedAt:       img.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		if img.AlbumID != nil {
			response.AlbumID = *img.AlbumID
		}
		if img.EnhancedPrompt != nil {
			response.EnhancedPrompt = *img.EnhancedPrompt
		}
		if img.ModelUsed != nil {
			response.ModelUsed = *img.ModelUsed
		}

		responses = append(responses, response)
	}

	return responses, nil
}

func (u *AIGeneratedImageUsecase) DeleteImage(ctx context.Context, id uint, userID uint) error {
	return u.repo.Delete(ctx, id, userID)
}

func (u *AIGeneratedImageUsecase) DeleteAlbum(ctx context.Context, albumID string, userID uint) error {
	return u.repo.DeleteByAlbumID(ctx, albumID, userID)
}

func (u *AIGeneratedImageUsecase) GetAlbumImages(ctx context.Context, albumID string) ([]*entity.AIImageResponse, error) {
	images, err := u.repo.GetByAlbumID(ctx, albumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get album images: %w", err)
	}

	var responses []*entity.AIImageResponse
	for _, img := range images {
		response := &entity.AIImageResponse{
			ID:              img.ID,
			Base64Data:      img.Base64Data,
			Prompt:          img.Prompt,
			VariationNumber: img.VariationNumber,
			IsAlbum:         img.IsAlbum,
			HasReference:    img.HasReference,
			CreatedAt:       img.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		if img.AlbumID != nil {
			response.AlbumID = *img.AlbumID
		}
		if img.EnhancedPrompt != nil {
			response.EnhancedPrompt = *img.EnhancedPrompt
		}
		if img.ModelUsed != nil {
			response.ModelUsed = *img.ModelUsed
		}

		responses = append(responses, response)
	}

	return responses, nil
}
