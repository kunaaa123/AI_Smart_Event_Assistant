package entity

import "time"

type OrganizerReview struct {
	ReviewID    int       `json:"review_id" gorm:"primaryKey"`
	OrganizerID int       `json:"organizer_id"`
	UserID      int       `json:"user_id"`
	Rating      int       `json:"rating"`
	Comment     string    `json:"comment"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
