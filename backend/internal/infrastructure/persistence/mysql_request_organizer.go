package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlRequestOrganizerRepository struct {
	db *gorm.DB
}

func NewMySQLRequestOrganizerRepository(db *gorm.DB) repository.RequestOrganizerRepository {
	return &mysqlRequestOrganizerRepository{db: db}
}

func (r *mysqlRequestOrganizerRepository) Create(ctx context.Context, req *entity.RequestOrganizer) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *mysqlRequestOrganizerRepository) GetByID(ctx context.Context, id string) (*entity.RequestOrganizer, error) {
	var req entity.RequestOrganizer
	result := r.db.WithContext(ctx).First(&req, "request_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &req, nil
}

func (r *mysqlRequestOrganizerRepository) Update(ctx context.Context, req *entity.RequestOrganizer) error {
	return r.db.WithContext(ctx).Model(&entity.RequestOrganizer{}).
		Where("request_id = ?", req.RequestID).
		Updates(req).Error
}

func (r *mysqlRequestOrganizerRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.RequestOrganizer{}, "request_id = ?", id).Error
}

func (r *mysqlRequestOrganizerRepository) GetAll(ctx context.Context) ([]entity.RequestOrganizer, error) {
	var reqs []entity.RequestOrganizer
	result := r.db.Find(&reqs)
	return reqs, result.Error
}
