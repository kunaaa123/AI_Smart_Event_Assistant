package entity

import "time"

type Favorite struct {
	FavoriteID int       `json:"favorite_id" gorm:"primaryKey;column:favorite_id"`
	UserID     int       `json:"user_id" gorm:"not null;column:user_id"`
	EventID    int       `json:"event_id" gorm:"not null;column:event_id"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime;column:created_at"`

	// Relations - ใช้ proper foreign key tags
	User  User  `json:"user,omitempty" gorm:"foreignKey:UserID;references:UserID"`
	Event Event `json:"event,omitempty" gorm:"foreignKey:EventID;references:EventID"`
}

func (Favorite) TableName() string {
	return "favorites"
}
