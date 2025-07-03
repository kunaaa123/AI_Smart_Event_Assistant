package persistence

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
	"gorm.io/gorm"
)

type mysqlRealmRepository struct {
	db *gorm.DB
}

func NewMySQLRealmRepository(db *gorm.DB) repository.RealmRepository {
	return &mysqlRealmRepository{db: db}
}

func (r *mysqlRealmRepository) Create(ctx context.Context, realm *entity.Realm) error {
	return r.db.WithContext(ctx).Create(realm).Error
}

func (r *mysqlRealmRepository) GetByID(ctx context.Context, id int) (*entity.Realm, error) {
	var realm entity.Realm
	if err := r.db.WithContext(ctx).First(&realm, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &realm, nil
}

func (r *mysqlRealmRepository) GetByOwnerID(ctx context.Context, ownerID int) ([]entity.Realm, error) {
	var realms []entity.Realm
	if err := r.db.WithContext(ctx).Where("owner_id = ?", ownerID).Find(&realms).Error; err != nil {
		return nil, err
	}
	return realms, nil
}

func (r *mysqlRealmRepository) Update(ctx context.Context, realm *entity.Realm) error {
	return r.db.WithContext(ctx).Model(&entity.Realm{}).Where("id = ?", realm.ID).Updates(realm).Error
}

func (r *mysqlRealmRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&entity.Realm{}, "id = ?", id).Error
}
