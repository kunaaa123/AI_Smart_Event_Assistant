package entity

import "time"

type EventReview struct {
	ReviewID  int       `json:"review_id" gorm:"primaryKey"`
	EventID   int       `json:"event_id"`
	UserID    int       `json:"user_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
