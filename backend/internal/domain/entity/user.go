package entity

import (
	"time"
)

// กำหนดชนิดของ Role เป็น string
type Role string

// ค่าคงที่สำหรับบทบาทต่างๆ
const (
	RoleMember    Role = "member"    // สมาชิกทั่วไป
	RoleOrganizer Role = "organizer" // ผู้จัดงาน
	RoleAdmin     Role = "admin"     // ผู้ดูแลระบบ
)

// โครงสร้างข้อมูลผู้ใช้
type User struct {
	UserID       int       `gorm:"primary_key;column:user_id" json:"user_id"`
	Username     string    `gorm:"column:username" json:"username"`
	Email        string    `gorm:"column:email" json:"email"`
	Password     string    `gorm:"column:password" json:"password"`
	Role         Role      `gorm:"column:role" json:"role"`
	ProfileImage *string   `gorm:"column:profile_image" json:"profile_image"`
	CreatedAt    time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	FirstName    string    `gorm:"column:first_name" json:"first_name"`
	LastName     string    `gorm:"column:last_name" json:"last_name"`
	Phone        string    `gorm:"column:phone" json:"phone"`
	Bio          string    `gorm:"column:bio" json:"bio"`
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
		Role:     RoleMember, // กำหนดค่าเริ่มต้นเป็นสมาชิก
	}
}

// NewUserHandler creates a new UserHandler
