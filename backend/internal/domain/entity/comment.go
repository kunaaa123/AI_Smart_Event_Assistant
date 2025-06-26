package entity

import "time"

type Comment struct {
	CommentID int       `gorm:"primary_key;column:comment_id"`
	EventID   int       `gorm:"column:event_id"`
	UserID    int       `gorm:"column:user_id"`
	Comment   string    `gorm:"column:comment"`
	CreatedAt time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

func (Comment) TableName() string {
	return "comments"
}
