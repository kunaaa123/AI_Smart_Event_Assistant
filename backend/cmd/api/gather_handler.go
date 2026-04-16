package main

import (
	"crypto/sha256"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type GatherSessionRequest struct {
	UserID   int         `json:"user_id"`
	Username string      `json:"username"`
	Avatar   interface{} `json:"avatar"`
	RealmID  string      `json:"realm_id"`
	Role     string      `json:"role"` // <-- เพิ่ม
}

func GatherSessionHandler(c *gin.Context) {
	// Respond that Gather integration was removed and exit handler.
	c.JSON(http.StatusGone, gin.H{"error": "Gather integration removed"})
	return

	var req GatherSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("gather: invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	secret := os.Getenv("GATHER_BRIDGE_SECRET")
	single := os.Getenv("SINGLE_REALM_ID")
	h := sha256.Sum256([]byte(secret))
	log.Printf("[GATHER] secret len=%d sha256=%x", len(secret), h[:8])
	gatherURL := os.Getenv("GATHER_CLONE_URL")
	if secret == "" || gatherURL == "" {
		log.Printf("gather: missing env - GATHER_BRIDGE_SECRET=%v, GATHER_CLONE_URL=%v", secret != "", gatherURL)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gather not configured"})
		return
	}

	if req.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}
	if req.Username == "" {
		req.Username = fmt.Sprintf("user_%d", req.UserID)
	}
	if req.RealmID == "" {
		req.RealmID = "demo"
	}
	// normalize role
	if req.Role == "" {
		req.Role = "member"
	}
	if single != "" {
		req.RealmID = single // บังคับใช้ single realm เสมอ
	}

	claims := jwt.MapClaims{
		"sub":      req.UserID,
		"username": req.Username,
		"avatar":   req.Avatar,
		"realm_id": req.RealmID,
		"role":     req.Role, // <-- ใส่ role ลง token
		"iat":      time.Now().Unix(),
		"exp":      time.Now().Add(2 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		log.Printf("gather: sign error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	joinURL := fmt.Sprintf("%s/play/%s?token=%s", gatherURL, req.RealmID, signed)
	c.JSON(http.StatusOK, gin.H{"join_url": joinURL})
}
