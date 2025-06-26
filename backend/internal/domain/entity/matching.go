package entity

import "time"

type Matching struct {
	MatchID     int       `gorm:"primary_key;column:match_id"`
	EventID     int       `gorm:"column:event_id"`
	OrganizerID int       `gorm:"column:organizer_id"`
	MatchedByAI bool      `gorm:"column:matched_by_ai;default:false"`
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

func (Matching) TableName() string {
	return "matchings"
}
