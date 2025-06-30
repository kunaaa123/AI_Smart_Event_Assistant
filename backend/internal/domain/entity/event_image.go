package entity

import "time"

type EventImage struct {
	ImageID   int       `json:"image_id" gorm:"primaryKey"`
	EventID   int       `json:"event_id"`
	ImageURL  string    `json:"image_url"`
	IsCover   bool      `json:"is_cover"`
	CreatedAt time.Time `json:"created_at"`
}

func (EventImage) TableName() string {
	return "event_images"
}
