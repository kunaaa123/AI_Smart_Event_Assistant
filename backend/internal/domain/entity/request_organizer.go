package entity

import "time"

type RequestOrganizer struct {
	RequestID int       `gorm:"primary_key;column:request_id"`
	UserID    int       `gorm:"column:user_id"`
	CreatedAt time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	PortImg   string    `gorm:"column:port_img"`
}

func (RequestOrganizer) TableName() string {
	return "request_organizers"
}
