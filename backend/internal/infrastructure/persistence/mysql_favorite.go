package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlFavoriteRepository struct {
	db *gorm.DB
}

func NewMySQLFavoriteRepository(db *gorm.DB) repository.FavoriteRepository {
	return &mysqlFavoriteRepository{db: db}
}

func (r *mysqlFavoriteRepository) Create(ctx context.Context, favorite *entity.Favorite) error {
	return r.db.WithContext(ctx).Create(favorite).Error
}

func (r *mysqlFavoriteRepository) GetByID(ctx context.Context, id string) (*entity.Favorite, error) {
	var favorite entity.Favorite
	result := r.db.WithContext(ctx).First(&favorite, "favorite_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &favorite, nil
}

func (r *mysqlFavoriteRepository) Update(ctx context.Context, favorite *entity.Favorite) error {
	return r.db.WithContext(ctx).Model(&entity.Favorite{}).
		Where("favorite_id = ?", favorite.FavoriteID).
		Updates(favorite).Error
}

func (r *mysqlFavoriteRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Favorite{}, "favorite_id = ?", id).Error
}

func (r *mysqlFavoriteRepository) GetAll(ctx context.Context) ([]entity.Favorite, error) {
	var favorites []entity.Favorite
	result := r.db.Find(&favorites)
	return favorites, result.Error
}
