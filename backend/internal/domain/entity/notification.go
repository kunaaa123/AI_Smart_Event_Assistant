package entity

import "time"

type Notification struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"not null;index" json:"user_id"`
	Type      string    `gorm:"size:100" json:"type"`
	Message   string    `gorm:"type:text" json:"message"`
	Data      string    `gorm:"type:text" json:"data"`
	IsRead    bool      `gorm:"not null;default:false" json:"is_read"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Notification) TableName() string { return "notifications" }
