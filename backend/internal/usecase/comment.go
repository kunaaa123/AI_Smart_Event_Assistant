package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type CommentUsecase struct {
	commentRepo repository.CommentRepository
}

func NewCommentUsecase(commentRepo repository.CommentRepository) *CommentUsecase {
	return &CommentUsecase{commentRepo: commentRepo}
}

func (u *CommentUsecase) Create(ctx context.Context, comment *entity.Comment) error {
	return u.commentRepo.Create(ctx, comment)
}

func (u *CommentUsecase) GetByID(ctx context.Context, id string) (*entity.Comment, error) {
	return u.commentRepo.GetByID(ctx, id)
}

func (u *CommentUsecase) Update(ctx context.Context, comment *entity.Comment) error {
	return u.commentRepo.Update(ctx, comment)
}

func (u *CommentUsecase) Delete(ctx context.Context, id string) error {
	return u.commentRepo.Delete(ctx, id)
}

func (u *CommentUsecase) GetAll(ctx context.Context) ([]entity.Comment, error) {
	return u.commentRepo.GetAll(ctx)
}
