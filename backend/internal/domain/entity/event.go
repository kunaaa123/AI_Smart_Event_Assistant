package entity

import "time"

type Event struct {
	EventID     int       `gorm:"primary_key;column:event_id" json:"event_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Description string    `gorm:"column:description" json:"description"`
	OrganizerID int       `gorm:"column:organizer_id" json:"organizer_id"`
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	EventImage  *string   `gorm:"column:event_image" json:"event_image"`
}

func (Event) TableName() string {
	return "events"
}
