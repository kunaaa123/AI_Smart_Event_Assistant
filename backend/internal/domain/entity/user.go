package entity

import (
	"time"
)

// ค่าคงที่สำหรับบทบาทต่างๆ
const (
	RoleMember    = "member"    // สมาชิกทั่วไป
	RoleOrganizer = "organizer" // ผู้จัดงาน
	RoleAdmin     = "admin"     // ผู้ดูแลระบบ
)

// โครงสร้างข้อมูลผู้ใช้
type User struct {
	UserID       int       `json:"user_id" gorm:"primaryKey"`
	Username     string    `json:"username"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Password     string    `json:"-"` // ซ่อนไม่ให้ส่งออกไป
	Role         string    `json:"role"`
	ProfileImage string    `json:"profile_image"`
	Bio          string    `json:"bio"`
	CreatedAt    time.Time `json:"created_at"`
	IsSuspended  bool      `json:"is_suspended" gorm:"default:false"` // เพิ่มตรงนี้
}

// กำหนดชื่อตารางสำหรับ GORM
func (User) TableName() string {
	return "users"
}

// ฟังก์ชันสร้างผู้ใช้ใหม่
func NewUser(username, email, password string) *User {
	return &User{
		Username: username,
		Email:    email,
		Password: password,
		Role:     RoleMember, // ตอนนี้จะใช้ได้แล้ว
	}
}

// NewUserHandler creates a new UserHandler
