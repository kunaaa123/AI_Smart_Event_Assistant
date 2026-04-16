package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func MeHandler(c *gin.Context) {
	// DEV: ผ่อนคลาย auth (ถ้ามี X-Dummy-User ใช้, ไม่มีก็คืน user mock)
	uid := c.GetHeader("X-Dummy-User")
	if uid == "" {
		uid = "1"
	}
	c.JSON(http.StatusOK, gin.H{
		"user_id":  uid,
		"username": "demo",
	})
}

func SessionHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"session_id": "local-dev-session",
		"user_id":    1,
	})
}

// NOTE: ย้ายบล็อคตรวจสถานะไปไว้ "ภายใน" ฟังก์ชัน Login ของคุณ หลังตรวจ email/password สำเร็จ:
// if user.IsSuspended {
//   c.JSON(http.StatusForbidden, gin.H{"error": "บัญชียังรอการอนุมัติจากแอดมิน"})
//   return
// }
