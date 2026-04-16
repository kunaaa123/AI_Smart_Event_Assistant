package persistence

import (
	"context"
	"strconv"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlVenueRepository struct {
	db *gorm.DB
}

func NewMySQLVenueRepository(db *gorm.DB) repository.VenueRepository {
	return &mysqlVenueRepository{db: db}
}

func (r *mysqlVenueRepository) GetAll(ctx context.Context) ([]entity.Venue, error) {
	var venues []entity.Venue
	result := r.db.WithContext(ctx).Find(&venues)
	return venues, result.Error
}

func (r *mysqlVenueRepository) GetByID(ctx context.Context, id string) (*entity.Venue, error) {
	var venue entity.Venue
	venueID, err := strconv.Atoi(id)
	if err != nil {
		return nil, err
	}

	result := r.db.WithContext(ctx).First(&venue, venueID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &venue, nil
}

func (r *mysqlVenueRepository) GetPopular(ctx context.Context, limit int) ([]entity.Venue, error) {
	var venues []entity.Venue
	result := r.db.WithContext(ctx).
		Where("rating >= ? AND review_count > ?", 4.0, 10).
		Order("rating DESC, review_count DESC").
		Limit(limit).
		Find(&venues)
	return venues, result.Error
}

func (r *mysqlVenueRepository) Create(ctx context.Context, venue *entity.Venue) error {
	return r.db.WithContext(ctx).Create(venue).Error
}

func (r *mysqlVenueRepository) Update(ctx context.Context, venue *entity.Venue) error {
	return r.db.WithContext(ctx).Save(venue).Error
}

func (r *mysqlVenueRepository) Delete(ctx context.Context, id string) error {
	venueID, err := strconv.Atoi(id)
	if err != nil {
		return err
	}
	return r.db.WithContext(ctx).Delete(&entity.Venue{}, venueID).Error
}

type mysqlVenueImageRepository struct {
	db *gorm.DB
}

func NewMySQLVenueImageRepository(db *gorm.DB) repository.VenueImageRepository {
	return &mysqlVenueImageRepository{db: db}
}

func (r *mysqlVenueImageRepository) GetByVenueID(ctx context.Context, venueID string) ([]entity.VenueImage, error) {
	var images []entity.VenueImage
	venueIDInt, err := strconv.Atoi(venueID)
	if err != nil {
		return nil, err
	}

	result := r.db.WithContext(ctx).Where("venue_id = ?", venueIDInt).Find(&images)
	return images, result.Error
}

func (r *mysqlVenueImageRepository) Create(ctx context.Context, image *entity.VenueImage) error {
	return r.db.WithContext(ctx).Create(image).Error
}

func (r *mysqlVenueImageRepository) Delete(ctx context.Context, imageID string) error {
	imageIDInt, err := strconv.Atoi(imageID)
	if err != nil {
		return err
	}
	return r.db.WithContext(ctx).Delete(&entity.VenueImage{}, imageIDInt).Error
}
