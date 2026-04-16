package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EventAdminHandler struct{ db *gorm.DB }

func NewEventAdminHandler(db *gorm.DB) *EventAdminHandler { return &EventAdminHandler{db: db} }

func (h *EventAdminHandler) RegisterRoutes(r *gin.Engine) {
	r.PATCH("/events/:id/active", h.patchActive)
}

func (h *EventAdminHandler) patchActive(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Active *bool `json:"active"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Active == nil {
		c.String(http.StatusBadRequest, "active (bool) required")
		return
	}

	// 1) ลองอัปเดตคอลัมน์ is_active
	tx := h.db.WithContext(c.Request.Context()).Exec("UPDATE events SET is_active = ? WHERE event_id = ?", *body.Active, id)
	if tx.Error == nil && tx.RowsAffected > 0 {
		c.JSON(http.StatusOK, gin.H{"ok": true, "event_id": id, "active": *body.Active})
		return
	}
	// 2) ลองอัปเดตคอลัมน์ active
	tx = h.db.WithContext(c.Request.Context()).Exec("UPDATE events SET active = ? WHERE event_id = ?", *body.Active, id)
	if tx.Error == nil && tx.RowsAffected > 0 {
		c.JSON(http.StatusOK, gin.H{"ok": true, "event_id": id, "active": *body.Active})
		return
	}
	// 3) ตกลงไปอัปเดต status
	status := "active"
	if !*body.Active {
		status = "suspended"
	}
	tx = h.db.WithContext(c.Request.Context()).Exec("UPDATE events SET status = ? WHERE event_id = ?", status, id)
	if tx.Error != nil || tx.RowsAffected == 0 {
		c.String(http.StatusBadRequest, "cannot update event active/status")
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "event_id": id, "active": *body.Active, "status": status})
}
