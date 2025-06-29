package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlOrganizerRepository struct {
	db *gorm.DB
}

func NewMySQLOrganizerRepository(db *gorm.DB) repository.OrganizerRepository {
	return &mysqlOrganizerRepository{db: db}
}

func (r *mysqlOrganizerRepository) Create(ctx context.Context, organizer *entity.Organizer) error {
	return r.db.WithContext(ctx).Create(organizer).Error
}

func (r *mysqlOrganizerRepository) GetByID(ctx context.Context, id string) (*entity.Organizer, error) {
	var organizer entity.Organizer
	result := r.db.WithContext(ctx).First(&organizer, "organizer_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &organizer, nil
}

func (r *mysqlOrganizerRepository) Update(ctx context.Context, organizer *entity.Organizer) error {
	return r.db.WithContext(ctx).Model(&entity.Organizer{}).
		Where("organizer_id = ?", organizer.OrganizerID).
		Updates(organizer).Error
}

func (r *mysqlOrganizerRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Organizer{}, "organizer_id = ?", id).Error
}

func (r *mysqlOrganizerRepository) GetAll(ctx context.Context) ([]entity.Organizer, error) {
	var organizers []entity.Organizer
	result := r.db.Find(&organizers)
	return organizers, result.Error
}

func (r *mysqlOrganizerRepository) GetAllWithName(ctx context.Context, out *[]entity.OrganizerWithName) error {
	return r.db.WithContext(ctx).
		Table("organizers").
		Select("organizers.organizer_id, organizers.user_id, organizers.expertise, users.first_name, users.last_name").
		Joins("JOIN users ON organizers.user_id = users.user_id").
		Scan(out).Error
}
