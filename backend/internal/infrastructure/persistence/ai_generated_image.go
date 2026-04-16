package persistence

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type GORMAIGeneratedImageRepository struct {
	db *gorm.DB
}

func NewMySQLAIGeneratedImageRepository(db *gorm.DB) repository.AIGeneratedImageRepository {
	return &GORMAIGeneratedImageRepository{db: db}
}

func (r *GORMAIGeneratedImageRepository) Create(ctx context.Context, image *entity.AIGeneratedImage) error {
	return r.db.WithContext(ctx).Create(image).Error
}

func (r *GORMAIGeneratedImageRepository) GetByUserAndType(ctx context.Context, userID uint, imageType string) ([]*entity.AIGeneratedImage, error) {
	var images []*entity.AIGeneratedImage

	// ตรวจสอบว่าตารางมีอยู่จริง
	if !r.db.Migrator().HasTable(&entity.AIGeneratedImage{}) {
		return images, nil // return empty slice แทน error
	}

	err := r.db.WithContext(ctx).
		Where("user_id = ? AND image_type = ?", userID, imageType).
		Order("created_at DESC").
		Find(&images).Error

	// ถ้าไม่พบข้อมูล ให้ return empty slice ไม่ใช่ error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return images, nil
	}

	return images, err
}

func (r *GORMAIGeneratedImageRepository) GetByAlbumID(ctx context.Context, albumID string) ([]*entity.AIGeneratedImage, error) {
	var images []*entity.AIGeneratedImage

	if !r.db.Migrator().HasTable(&entity.AIGeneratedImage{}) {
		return images, nil
	}

	err := r.db.WithContext(ctx).
		Where("album_id = ?", albumID).
		Order("variation_number ASC").
		Find(&images).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return images, nil
	}

	return images, err
}

func (r *GORMAIGeneratedImageRepository) Delete(ctx context.Context, id uint, userID uint) error {
	if !r.db.Migrator().HasTable(&entity.AIGeneratedImage{}) {
		return nil // ไม่มีตารางก็ถือว่าลบสำเร็จ
	}

	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&entity.AIGeneratedImage{})

	if result.Error != nil {
		return result.Error
	}

	// ไม่ error แม้ว่าจะไม่มีข้อมูลให้ลบ
	return nil
}

func (r *GORMAIGeneratedImageRepository) DeleteByAlbumID(ctx context.Context, albumID string, userID uint) error {
	if !r.db.Migrator().HasTable(&entity.AIGeneratedImage{}) {
		return nil
	}

	result := r.db.WithContext(ctx).
		Where("album_id = ? AND user_id = ?", albumID, userID).
		Delete(&entity.AIGeneratedImage{})

	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *GORMAIGeneratedImageRepository) GetUserImageCount(ctx context.Context, userID uint, imageType string) (int64, error) {
	var count int64

	if !r.db.Migrator().HasTable(&entity.AIGeneratedImage{}) {
		return 0, nil
	}

	err := r.db.WithContext(ctx).
		Model(&entity.AIGeneratedImage{}).
		Where("user_id = ? AND image_type = ?", userID, imageType).
		Count(&count).Error

	return count, err
}
