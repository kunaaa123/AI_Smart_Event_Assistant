package entity

import "time"

type Event struct {
	EventID     int       `json:"event_id" gorm:"primaryKey;column:event_id"`
	Name        string    `json:"name" gorm:"column:name"`
	Description string    `json:"description" gorm:"column:description"`
	OrganizerID *int      `json:"organizer_id,omitempty" gorm:"column:organizer_id"` // <- เปลี่ยนเป็น *int
	UserID      *int      `json:"user_id,omitempty" gorm:"column:user_id"`
	VenueID     *int      `json:"venue_id,omitempty" gorm:"column:venue_id"`
	EventImage  *string   `json:"event_image,omitempty" gorm:"column:event_image"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime;column:created_at"`
	IsActive    bool      `json:"is_active" gorm:"column:is_active;default:true"`

	Price *float64 `json:"price,omitempty" gorm:"column:price"`
}

func (Event) TableName() string {
	return "events"
}

type EventWithStats struct {
	EventID      int      `json:"event_id"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	OrganizerID  *int     `json:"organizer_id"` // <- รองรับ NULL
	IsActive     bool     `json:"is_active" gorm:"column:is_active"`
	AvgRating    float64  `json:"avgRating" gorm:"column:avgRating"`
	TotalReviews int      `json:"totalReviews" gorm:"column:totalReviews"`
	CoverImage   string   `json:"cover_image"`
	Price        *float64 `json:"price,omitempty"`
}
