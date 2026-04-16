package entity

import "time"

type RequestOrganizer struct {
	RequestID     int       `json:"request_id" gorm:"primary_key;column:request_id"`
	UserID        int       `json:"user_id" gorm:"column:user_id"`
	OrganizerName string    `json:"organizer_name" gorm:"column:organizer_name"`
	Category      string    `json:"category" gorm:"column:category"`
	Email         string    `json:"email" gorm:"column:email"`
	Price         string    `json:"price" gorm:"column:price"`
	Phone         string    `json:"phone" gorm:"column:phone"`
	Description   string    `json:"description" gorm:"column:description"`
	ImageLabel    string    `json:"image_label" gorm:"type:text;column:image_label"`
	Status        string    `json:"status" gorm:"column:status"`
	CreatedAt     time.Time `json:"created_at" gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

func (RequestOrganizer) TableName() string {
	return "request_organizers"
}

type RequestOrganizerImage struct {
	ImageID   int       `json:"image_id" gorm:"primaryKey;column:image_id"`
	RequestID int       `json:"request_id" gorm:"column:request_id"`
	ImageURL  string    `json:"image_url" gorm:"column:image_url"`
	IsCover   bool      `json:"is_cover" gorm:"column:is_cover"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

func (RequestOrganizerImage) TableName() string {
	return "request_organizer_images"
}
