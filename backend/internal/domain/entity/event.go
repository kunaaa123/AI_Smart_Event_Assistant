package entity

import "time"

type Event struct {
	EventID     int       `gorm:"primary_key;column:event_id"`
	Name        string    `gorm:"column:name"`
	Description string    `gorm:"column:description"`
	OrganizerID int       `gorm:"column:organizer_id"`
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	EventImage  *string   `gorm:"column:event_image"`
}

func (Event) TableName() string {
	return "events"
}
