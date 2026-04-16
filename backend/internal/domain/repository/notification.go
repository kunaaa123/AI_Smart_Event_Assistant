package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type NotificationRepository interface {
	Create(ctx context.Context, n *entity.Notification) error
	GetByUserID(ctx context.Context, userID int) ([]entity.Notification, error)
	MarkRead(ctx context.Context, id int) error
	CountUnread(ctx context.Context, userID int) (int64, error)
}
