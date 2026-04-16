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

type mysqlRequestOrganizerImageRepository struct {
	db *gorm.DB
}

func NewMySQLRequestOrganizerImageRepository(db *gorm.DB) repository.RequestOrganizerImageRepository {
	return &mysqlRequestOrganizerImageRepository{db: db}
}

func (r *mysqlRequestOrganizerImageRepository) Create(ctx context.Context, img *entity.RequestOrganizerImage) error {
	return r.db.WithContext(ctx).Create(img).Error
}

func (r *mysqlRequestOrganizerImageRepository) GetByRequestID(ctx context.Context, requestID int) ([]entity.RequestOrganizerImage, error) {
	var imgs []entity.RequestOrganizerImage
	err := r.db.WithContext(ctx).Where("request_id = ?", requestID).Order("created_at ASC").Find(&imgs).Error
	return imgs, err
}

func (r *mysqlRequestOrganizerImageRepository) Delete(ctx context.Context, imageID int) error {
	return r.db.WithContext(ctx).Delete(&entity.RequestOrganizerImage{}, imageID).Error
}
