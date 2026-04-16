package entity

import "time"

type PasswordResetToken struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    int       `json:"user_id" gorm:"index"`
	Token     string    `json:"token" gorm:"uniqueIndex;size:191"`
	ExpiresAt time.Time `json:"expires_at" gorm:"index"`
	Used      bool      `json:"used" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}
