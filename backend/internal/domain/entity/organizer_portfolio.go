package entity

import "time"

type OrganizerPortfolio struct {
	PortfolioID int       `gorm:"primary_key;column:portfolio_id" json:"portfolio_id"`
	OrganizerID int       `gorm:"column:organizer_id" json:"organizer_id"`
	Title       string    `gorm:"column:title" json:"title"`
	Description string    `gorm:"column:description" json:"description"`
	ImageURL    string    `gorm:"column:image_url" json:"image_url"`
	Category    string    `gorm:"column:category" json:"category"`
	Price       string    `gorm:"column:price" json:"price"`
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (OrganizerPortfolio) TableName() string {
	return "organizer_portfolios"
}
