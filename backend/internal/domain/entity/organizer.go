package entity

import "time"

type Organizer struct {
	OrganizerID  int       `gorm:"primary_key;column:organizer_id"`
	UserID       int       `gorm:"column:user_id" json:"user_id"`
	PortfolioImg *string   `gorm:"column:portfolio_img"`
	Expertise    string    `gorm:"column:expertise"`
	CreatedAt    time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

func (Organizer) TableName() string {
	return "organizers"
}

type OrganizerWithName struct {
	OrganizerID int    `json:"organizer_id"`
	UserID      int    `json:"user_id"`
	Expertise   string `json:"expertise"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
}
