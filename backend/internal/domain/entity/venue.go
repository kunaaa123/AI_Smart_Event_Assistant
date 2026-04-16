package entity

import "time"

type Venue struct {
	VenueID     int       `json:"venue_id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	Location    string    `json:"location"`
	VenueType   string    `json:"venue_type"`
	PriceRange  string    `json:"price_range"`
	CoverImage  string    `json:"cover_image"`
	Rating      float64   `json:"rating" gorm:"type:decimal(3,2);default:0.00"`
	ReviewCount int       `json:"review_count" gorm:"default:0"`
	Latitude    float64   `json:"latitude" gorm:"type:decimal(10,8);default:0"`
	Longitude   float64   `json:"longitude" gorm:"type:decimal(11,8);default:0"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (Venue) TableName() string {
	return "venues"
}

type VenueImage struct {
	ImageID   int       `json:"image_id" gorm:"primaryKey;autoIncrement"`
	VenueID   int       `json:"venue_id"`
	ImageURL  string    `json:"image_url"`
	IsCover   bool      `json:"is_cover"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (VenueImage) TableName() string {
	return "venue_images"
}
