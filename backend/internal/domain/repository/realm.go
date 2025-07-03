package repository

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
)

type RealmRepository interface {
	Create(ctx context.Context, realm *entity.Realm) error
	GetByID(ctx context.Context, id int) (*entity.Realm, error) // เปลี่ยน string → int
	GetByOwnerID(ctx context.Context, ownerID int) ([]entity.Realm, error)
	Update(ctx context.Context, realm *entity.Realm) error
	Delete(ctx context.Context, id int) error
}
