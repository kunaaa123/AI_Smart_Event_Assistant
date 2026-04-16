package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mySQLReportRepository struct{ db *gorm.DB }

func NewMySQLReportRepository(db *gorm.DB) repository.ReportRepository {
	return &mySQLReportRepository{db: db}
}

func (r *mySQLReportRepository) Create(ctx context.Context, rep *entity.Report) error {
	return r.db.WithContext(ctx).Create(rep).Error
}

func (r *mySQLReportRepository) GetByID(ctx context.Context, id int) (*entity.Report, error) {
	var rep entity.Report
	if err := r.db.WithContext(ctx).First(&rep, "report_id = ?", id).Error; err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *mySQLReportRepository) List(ctx context.Context) ([]*entity.Report, error) {
	var reps []*entity.Report
	if err := r.db.WithContext(ctx).Order("created_at DESC").Find(&reps).Error; err != nil {
		return nil, err
	}
	return reps, nil
}

func (r *mySQLReportRepository) ListByEvent(ctx context.Context, eventID int) ([]*entity.Report, error) {
	var reps []*entity.Report
	if err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Order("created_at DESC").Find(&reps).Error; err != nil {
		return nil, err
	}
	return reps, nil
}

func (r *mySQLReportRepository) ListByOrganizer(ctx context.Context, organizerID int) ([]*entity.Report, error) {
	var reps []*entity.Report
	if err := r.db.WithContext(ctx).Where("organizer_id = ?", organizerID).Order("created_at DESC").Find(&reps).Error; err != nil {
		return nil, err
	}
	return reps, nil
}

func (r *mySQLReportRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	return r.db.WithContext(ctx).Model(&entity.Report{}).Where("report_id = ?", id).Update("status", status).Error
}
