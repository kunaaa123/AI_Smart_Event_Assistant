package entity

import "time"

type Event struct {
	EventID     int       `json:"event_id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	OrganizerID int       `json:"organizer_id"`
	UserID      int       `json:"user_id"` // <--- ต้องมี field นี้
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	EventImage  *string   `json:"event_image"`
}

func (Event) TableName() string {
	return "events"
}

type EventWithStats struct {
	EventID      int     `json:"event_id"`
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	OrganizerID  int     `json:"organizer_id"`
	AvgRating    float64 `json:"avgRating" gorm:"column:avgRating"`
	TotalReviews int     `json:"totalReviews" gorm:"column:totalReviews"`
	CoverImage   string  `json:"cover_image"`
}
