package entity

import "time"

type Report struct {
	ReportID    uint      `gorm:"primaryKey;column:report_id" json:"report_id"`
	EventID     int       `gorm:"column:event_id" json:"event_id,omitempty"`
	OrganizerID *int      `gorm:"column:organizer_id" json:"organizer_id,omitempty"` // เพิ่มช่องนี้ (nullable)
	UserID      int       `gorm:"column:user_id;not null" json:"user_id"`
	Reason      string    `gorm:"size:255;not null" json:"reason"`
	Details     string    `gorm:"type:text" json:"details"`
	Status      string    `gorm:"size:20;default:'pending'" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Report) TableName() string { return "reports" }
