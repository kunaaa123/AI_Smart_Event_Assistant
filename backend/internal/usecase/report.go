package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type ReportUsecase interface {
	Create(ctx context.Context, rep *entity.Report) error
	GetByID(ctx context.Context, id int) (*entity.Report, error)
	List(ctx context.Context) ([]*entity.Report, error)
	ListByEvent(ctx context.Context, eventID int) ([]*entity.Report, error)
	ListByOrganizer(ctx context.Context, organizerID int) ([]*entity.Report, error) // เพิ่ม
	UpdateStatus(ctx context.Context, id int, status string) error
}

type reportUsecase struct {
	repo repository.ReportRepository
}

func NewReportUsecase(repo repository.ReportRepository) ReportUsecase {
	return &reportUsecase{repo: repo}
}

func (u *reportUsecase) Create(ctx context.Context, rep *entity.Report) error {
	if rep == nil {
		return errors.New("nil report")
	}
	// ต้องมี event_id หรือ organizer_id อย่างน้อยหนึ่งค่า
	if rep.EventID <= 0 && (rep.OrganizerID == nil || *rep.OrganizerID <= 0) {
		return errors.New("event_id or organizer_id is required")
	}
	rep.Reason = strings.TrimSpace(rep.Reason)
	if rep.Reason == "" {
		return errors.New("reason is required")
	}
	if rep.Status == "" {
		rep.Status = "pending"
	}
	return u.repo.Create(ctx, rep)
}

func (u *reportUsecase) GetByID(ctx context.Context, id int) (*entity.Report, error) {
	if id <= 0 {
		return nil, errors.New("invalid id")
	}
	return u.repo.GetByID(ctx, id)
}

func (u *reportUsecase) List(ctx context.Context) ([]*entity.Report, error) {
	return u.repo.List(ctx)
}

func (u *reportUsecase) ListByEvent(ctx context.Context, eventID int) ([]*entity.Report, error) {
	if eventID <= 0 {
		return nil, errors.New("invalid event id")
	}
	return u.repo.ListByEvent(ctx, eventID)
}

func (u *reportUsecase) ListByOrganizer(ctx context.Context, organizerID int) ([]*entity.Report, error) {
	if organizerID <= 0 {
		return nil, errors.New("invalid organizer id")
	}
	return u.repo.ListByOrganizer(ctx, organizerID)
}

func (u *reportUsecase) UpdateStatus(ctx context.Context, id int, status string) error {
	if id <= 0 {
		return errors.New("invalid id")
	}
	status = strings.ToLower(strings.TrimSpace(status))
	switch status {
	case "pending", "resolved", "rejected":
	default:
		return errors.New("invalid status")
	}
	return u.repo.UpdateStatus(ctx, id, status)
}
