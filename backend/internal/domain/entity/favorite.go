package entity

type Favorite struct {
	FavoriteID int `gorm:"primary_key;column:favorite_id"`
	UserID     int `gorm:"column:user_id"`
	EventID    int `gorm:"column:event_id"`
}

func (Favorite) TableName() string {
	return "favorites"
}
