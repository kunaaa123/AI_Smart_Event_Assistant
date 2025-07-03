package usecase

import (
	"context"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/repository"
)

type RealmUsecase struct {
	realmRepo repository.RealmRepository
}

func NewRealmUsecase(realmRepo repository.RealmRepository) *RealmUsecase {
	return &RealmUsecase{realmRepo: realmRepo}
}

func (u *RealmUsecase) Create(ctx context.Context, realm *entity.Realm) error {
	return u.realmRepo.Create(ctx, realm)
}

func (u *RealmUsecase) GetByID(ctx context.Context, id int) (*entity.Realm, error) {
	return u.realmRepo.GetByID(ctx, id)
}

func (u *RealmUsecase) GetByOwnerID(ctx context.Context, ownerID int) ([]entity.Realm, error) {
	return u.realmRepo.GetByOwnerID(ctx, ownerID)
}

func (u *RealmUsecase) Update(ctx context.Context, realm *entity.Realm) error {
	return u.realmRepo.Update(ctx, realm)
}

func (u *RealmUsecase) Delete(ctx context.Context, id int) error {
	return u.realmRepo.Delete(ctx, id)
}
