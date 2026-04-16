package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type MySQLNotificationRepository struct {
	db *gorm.DB
}

func NewMySQLNotificationRepository(db *gorm.DB) repository.NotificationRepository {
	return &MySQLNotificationRepository{db: db}
}

func (r *MySQLNotificationRepository) Create(ctx context.Context, n *entity.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *MySQLNotificationRepository) GetByUserID(ctx context.Context, userID int) ([]entity.Notification, error) {
	var out []entity.Notification
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&out).Error
	return out, err
}

func (r *MySQLNotificationRepository) MarkRead(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("id = ?", id).
		Update("is_read", true).Error
}

func (r *MySQLNotificationRepository) CountUnread(ctx context.Context, userID int) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ? AND is_read = 0", userID).
		Count(&c).Error
	return c, err
}
