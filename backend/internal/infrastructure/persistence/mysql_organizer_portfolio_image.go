package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"gorm.io/gorm"
)

type mysqlOrganizerPortfolioImageRepository struct {
	db *gorm.DB
}

func NewMySQLOrganizerPortfolioImageRepository(db *gorm.DB) *mysqlOrganizerPortfolioImageRepository {
	return &mysqlOrganizerPortfolioImageRepository{db}
}

func (r *mysqlOrganizerPortfolioImageRepository) Create(ctx context.Context, img *entity.OrganizerPortfolioImage) error {
	return r.db.WithContext(ctx).Create(img).Error
}

func (r *mysqlOrganizerPortfolioImageRepository) GetByPortfolioID(ctx context.Context, portfolioID int) ([]entity.OrganizerPortfolioImage, error) {
	var imgs []entity.OrganizerPortfolioImage
	err := r.db.WithContext(ctx).Where("portfolio_id = ?", portfolioID).Find(&imgs).Error
	return imgs, err
}

func (r *mysqlOrganizerPortfolioImageRepository) Delete(ctx context.Context, imageID int) error {
	return r.db.WithContext(ctx).Delete(&entity.OrganizerPortfolioImage{}, imageID).Error
}
