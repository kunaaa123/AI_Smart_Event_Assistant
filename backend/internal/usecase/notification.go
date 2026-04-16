package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type NotificationUsecase struct {
	repo repository.NotificationRepository
}

func NewNotificationUsecase(r repository.NotificationRepository) *NotificationUsecase {
	return &NotificationUsecase{repo: r}
}

func (u *NotificationUsecase) Create(ctx context.Context, n *entity.Notification) error {
	return u.repo.Create(ctx, n)
}
func (u *NotificationUsecase) GetByUserID(ctx context.Context, userID int) ([]entity.Notification, error) {
	return u.repo.GetByUserID(ctx, userID)
}
func (u *NotificationUsecase) MarkRead(ctx context.Context, id int) error {
	return u.repo.MarkRead(ctx, id)
}
func (u *NotificationUsecase) CountUnread(ctx context.Context, userID int) (int64, error) {
	return u.repo.CountUnread(ctx, userID)
}

// สร้างแจ้งเตือนแบบง่าย
func (u *NotificationUsecase) NotifyUser(ctx context.Context, userID int, title, message string) error {
	if userID <= 0 {
		return errors.New("invalid userID")
	}
	n := &entity.Notification{
		UserID:  userID,
		Type:    strings.TrimSpace(title),
		Message: strings.TrimSpace(message),
	}
	return u.repo.Create(ctx, n)
}

// สร้างแจ้งเตือนพร้อม payload JSON
func (u *NotificationUsecase) NotifyUserWithData(ctx context.Context, userID int, title, message, data string) error {
	if userID <= 0 {
		return errors.New("invalid userID")
	}
	n := &entity.Notification{
		UserID:  userID,
		Type:    strings.TrimSpace(title),
		Message: strings.TrimSpace(message),
		Data:    strings.TrimSpace(data),
	}
	return u.repo.Create(ctx, n)
}
