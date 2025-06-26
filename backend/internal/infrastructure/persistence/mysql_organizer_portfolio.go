package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlOrganizerPortfolioRepository struct {
	db *gorm.DB
}

func NewMySQLOrganizerPortfolioRepository(db *gorm.DB) repository.OrganizerPortfolioRepository {
	return &mysqlOrganizerPortfolioRepository{db: db}
}

func (r *mysqlOrganizerPortfolioRepository) Create(ctx context.Context, portfolio *entity.OrganizerPortfolio) error {
	return r.db.WithContext(ctx).Create(portfolio).Error
}

func (r *mysqlOrganizerPortfolioRepository) GetByID(ctx context.Context, id string) (*entity.OrganizerPortfolio, error) {
	var portfolio entity.OrganizerPortfolio
	result := r.db.WithContext(ctx).First(&portfolio, "portfolio_id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &portfolio, nil
}

func (r *mysqlOrganizerPortfolioRepository) Update(ctx context.Context, portfolio *entity.OrganizerPortfolio) error {
	return r.db.WithContext(ctx).Model(&entity.OrganizerPortfolio{}).
		Where("portfolio_id = ?", portfolio.PortfolioID).
		Updates(portfolio).Error
}

func (r *mysqlOrganizerPortfolioRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.OrganizerPortfolio{}, "portfolio_id = ?", id).Error
}

func (r *mysqlOrganizerPortfolioRepository) GetAll(ctx context.Context) ([]entity.OrganizerPortfolio, error) {
	var portfolios []entity.OrganizerPortfolio
	result := r.db.Find(&portfolios)
	return portfolios, result.Error
}

func (r *mysqlOrganizerPortfolioRepository) GetByOrganizerID(ctx context.Context, organizerID string) ([]entity.OrganizerPortfolio, error) {
	var portfolios []entity.OrganizerPortfolio
	result := r.db.Where("organizer_id = ?", organizerID).Find(&portfolios)
	return portfolios, result.Error
}
