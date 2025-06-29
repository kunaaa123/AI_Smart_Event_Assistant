package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlEventRepository struct {
	db *gorm.DB
}

func NewMySQLEventRepository(db *gorm.DB) repository.EventRepository {
	return &mysqlEventRepository{db: db}
}

func (r *mysqlEventRepository) Create(ctx context.Context, event *entity.Event) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *mysqlEventRepository) GetByID(ctx context.Context, id string) (*entity.Event, error) {
	var event entity.Event
	result := r.db.WithContext(ctx).First(&event, "event_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &event, nil
}

func (r *mysqlEventRepository) Update(ctx context.Context, event *entity.Event) error {
	return r.db.WithContext(ctx).Model(&entity.Event{}).
		Where("event_id = ?", event.EventID).
		Updates(event).Error
}

func (r *mysqlEventRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Event{}, "event_id = ?", id).Error
}

func (r *mysqlEventRepository) GetAll(ctx context.Context) ([]entity.Event, error) {
	var events []entity.Event
	result := r.db.Find(&events)
	return events, result.Error
}

// ใน repository
func (r *mysqlEventRepository) GetByUserID(ctx context.Context, userID string) ([]entity.Event, error) {
	var events []entity.Event
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}
