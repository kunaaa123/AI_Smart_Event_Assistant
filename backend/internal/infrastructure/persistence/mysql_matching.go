package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlMatchingRepository struct {
	db *gorm.DB
}

func NewMySQLMatchingRepository(db *gorm.DB) repository.MatchingRepository {
	return &mysqlMatchingRepository{db: db}
}

func (r *mysqlMatchingRepository) Create(ctx context.Context, matching *entity.Matching) error {
	return r.db.WithContext(ctx).Create(matching).Error
}

func (r *mysqlMatchingRepository) GetByID(ctx context.Context, id string) (*entity.Matching, error) {
	var matching entity.Matching
	result := r.db.WithContext(ctx).First(&matching, "match_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &matching, nil
}

func (r *mysqlMatchingRepository) Update(ctx context.Context, matching *entity.Matching) error {
	return r.db.WithContext(ctx).Model(&entity.Matching{}).
		Where("match_id = ?", matching.MatchID).
		Updates(matching).Error
}

func (r *mysqlMatchingRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Matching{}, "match_id = ?", id).Error
}

func (r *mysqlMatchingRepository) GetAll(ctx context.Context) ([]entity.Matching, error) {
	var matchings []entity.Matching
	result := r.db.Find(&matchings)
	return matchings, result.Error
}
