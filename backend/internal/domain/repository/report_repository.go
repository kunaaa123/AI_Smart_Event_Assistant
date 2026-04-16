package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type ReportRepository interface {
	Create(ctx context.Context, r *entity.Report) error
	GetByID(ctx context.Context, id int) (*entity.Report, error)
	List(ctx context.Context) ([]*entity.Report, error)
	ListByEvent(ctx context.Context, eventID int) ([]*entity.Report, error)
	ListByOrganizer(ctx context.Context, organizerID int) ([]*entity.Report, error) // เพิ่ม
	UpdateStatus(ctx context.Context, id int, status string) error
}
