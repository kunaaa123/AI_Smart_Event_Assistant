package entity

import "time"

type OrganizerPortfolioImage struct {
	ImageID     int       `json:"image_id" gorm:"primaryKey"`
	PortfolioID int       `json:"portfolio_id"`
	ImageURL    string    `json:"image_url"`
	IsCover     bool      `json:"is_cover"`
	CreatedAt   time.Time `json:"created_at"`
}

func (OrganizerPortfolioImage) TableName() string {
	return "organizer_portfolio_images"
}
