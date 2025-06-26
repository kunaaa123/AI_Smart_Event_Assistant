package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlCommentRepository struct {
	db *gorm.DB
}

func NewMySQLCommentRepository(db *gorm.DB) repository.CommentRepository {
	return &mysqlCommentRepository{db: db}
}

func (r *mysqlCommentRepository) Create(ctx context.Context, comment *entity.Comment) error {
	return r.db.WithContext(ctx).Create(comment).Error
}

func (r *mysqlCommentRepository) GetByID(ctx context.Context, id string) (*entity.Comment, error) {
	var comment entity.Comment
	result := r.db.WithContext(ctx).First(&comment, "comment_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &comment, nil
}

func (r *mysqlCommentRepository) Update(ctx context.Context, comment *entity.Comment) error {
	return r.db.WithContext(ctx).Model(&entity.Comment{}).
		Where("comment_id = ?", comment.CommentID).
		Updates(comment).Error
}

func (r *mysqlCommentRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Comment{}, "comment_id = ?", id).Error
}

func (r *mysqlCommentRepository) GetAll(ctx context.Context) ([]entity.Comment, error) {
	var comments []entity.Comment
	result := r.db.Find(&comments)
	return comments, result.Error
}
