package entity

import "time"

type VenueReview struct {
	ReviewID  int       `json:"review_id" gorm:"primaryKey;autoIncrement"`
	VenueID   int       `json:"venue_id" gorm:"index;not null"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username,omitempty"`
	Rating    int       `json:"rating" gorm:"not null"`
	Comment   string    `json:"comment" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (VenueReview) TableName() string {
	return "venue_reviews"
}
