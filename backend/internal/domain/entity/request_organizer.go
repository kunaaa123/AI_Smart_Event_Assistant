package entity

import "time"

type RequestOrganizer struct {
	RequestID     int       `gorm:"primary_key;column:request_id"`
	UserID        int       `gorm:"column:user_id"`
	OrganizerName string    `gorm:"column:organizer_name"`
	Category      string    `gorm:"column:category"`
	Email         string    `gorm:"column:email"`
	Price         string    `gorm:"column:price"`
	Phone         string    `gorm:"column:phone"`
	Description   string    `gorm:"column:description"`
	ImageLabel    string    `gorm:"column:image_label"`
	CreatedAt     time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

func (RequestOrganizer) TableName() string {
	return "request_organizers"
}
