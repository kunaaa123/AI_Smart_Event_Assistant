package http

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type EventHandler struct {
	eventUsecase *usecase.EventUsecase
	db           *gorm.DB
	notifUC      *usecase.NotificationUsecase
}

func NewEventHandler(uc *usecase.EventUsecase) *EventHandler {
	return &EventHandler{eventUsecase: uc}
}

func (h *EventHandler) WithDB(db *gorm.DB) *EventHandler {
	h.db = db
	return h
}
func (h *EventHandler) WithNotif(n *usecase.NotificationUsecase) *EventHandler {
	h.notifUC = n
	return h
}

func (h *EventHandler) RegisterRoutes(router *gin.Engine) {
	events := router.Group("/events")
	{
		events.POST("", h.CreateEvent)
		events.GET("", h.GetAllWithStats)
		events.GET("/:id", h.GetEvent)
		events.PUT("/:id", h.UpdateEvent)
		events.DELETE("/:id", h.DeleteEvent)
		events.GET("/user/:user_id", h.GetEventsByUserID)
		events.PATCH("/:id/status", h.UpdateEventStatus)
	}
}

// CreateEvent รองรับ form-data และจะใช้ organizer_self=true เพื่อไม่ใส่ organizer_id (เก็บ NULL แทน)
func (h *EventHandler) CreateEvent(c *gin.Context) {
	// อ่านจาก multipart/form-data หรือ x-www-form-urlencoded
	name := c.PostForm("name")
	description := c.PostForm("description")
	userIDStr := c.PostForm("user_id")

	if strings.TrimSpace(name) == "" || strings.TrimSpace(userIDStr) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and user_id are required"})
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	// organizer_self flag
	orgSelf := c.PostForm("organizer_self")
	var organizerID *int
	if orgSelf == "true" || orgSelf == "1" {
		organizerID = nil // will be NULL in DB
	} else {
		orgStr := c.PostForm("organizer_id")
		if orgStr != "" {
			if v, err := strconv.Atoi(orgStr); err == nil {
				tmp := v
				organizerID = &tmp
			}
		}
	}

	// optional: venue_id
	var venueID *int
	if vs := c.PostForm("venue_id"); vs != "" {
		if v, err := strconv.Atoi(vs); err == nil {
			tmp := v
			venueID = &tmp
		}
	}

	// optional: price
	var price *float64
	if ps := c.PostForm("price"); ps != "" {
		if f, err := strconv.ParseFloat(ps, 64); err == nil {
			price = &f
		}
	}

	evt := &entity.Event{
		Name:        name,
		Description: description,
		OrganizerID: organizerID,
		UserID:      func(i int) *int { return &i }(userID),
		VenueID:     venueID,
		Price:       price,
	}

	// create event (DB insert)
	if err := h.eventUsecase.Create(c.Request.Context(), evt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// handle optional file upload "event_image"
	file, ferr := c.FormFile("event_image")
	if ferr == nil && file != nil {
		uploadsDir := "./uploads"
		_ = os.MkdirAll(uploadsDir, 0755)
		filename := fmt.Sprintf("event_%d_%s", evt.EventID, filepath.Base(file.Filename))
		dst := filepath.Join(uploadsDir, filename)
		if saveErr := c.SaveUploadedFile(file, dst); saveErr == nil {
			rel := fmt.Sprintf("/uploads/%s", filename)
			evt.EventImage = &rel
			// update event to set event_image path
			_ = h.eventUsecase.Update(c.Request.Context(), evt)
		}
	}

	c.JSON(http.StatusCreated, evt)
}

func (h *EventHandler) GetAllEvents(c *gin.Context) {
	events, err := h.eventUsecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) GetEvent(c *gin.Context) {
	id := c.Param("id")
	event, err := h.eventUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) UpdateEvent(c *gin.Context) {
	var event entity.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.eventUsecase.Update(c.Request.Context(), &event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	err := h.eventUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

func (h *EventHandler) GetEventsByUserID(c *gin.Context) {
	userID := c.Param("user_id")
	events, err := h.eventUsecase.GetByUserIDWithStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, events)
}

func (h *EventHandler) GetAllWithStats(c *gin.Context) {
	events, err := h.eventUsecase.GetAllWithStats(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, events)
}

// อัปเดตสถานะแบบบางฟิลด์
func (h *EventHandler) UpdateEventStatus(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		IsActive bool   `json:"is_active"`
		Reason   string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": "invalid body"})
		return
	}
	// อัปเดตคอลัมน์ is_active; ถ้าไม่มี ให้ fallback เป็น status
	tx := h.db.Model(&entity.Event{}).Where("event_id = ?", id).Update("is_active", body.IsActive)
	if tx.Error != nil {
		c.JSON(500, gin.H{"error": "failed to update status"})
		return
	}
	if tx.RowsAffected == 0 {
		status := "active"
		if !body.IsActive {
			status = "suspended"
		}
		if err := h.db.Exec("UPDATE events SET status=? WHERE event_id=?", status, id).Error; err != nil {
			c.JSON(500, gin.H{"error": "failed to update status"})
			return
		}
	}

	// แจ้งเตือนเจ้าของอีเวนท์เมื่อถูกระงับ
	if h.notifUC != nil && !body.IsActive {
		intID, _ := strconv.Atoi(id)
		if uid, err := h.resolveOwnerUserID(c.Request.Context(), intID); err == nil && uid > 0 {
			msg := "อีเวนท์ของคุณถูกระงับโดยผู้ดูแลระบบ"
			if s := strings.TrimSpace(body.Reason); s != "" {
				msg = s
			}
			payload := map[string]any{
				"kind":     "event_suspended",
				"event_id": intID,
				"reason":   strings.TrimSpace(body.Reason),
			}
			data, _ := json.Marshal(payload)
			_ = h.notifUC.NotifyUserWithData(c.Request.Context(), uid, "อีเวนท์ถูกระงับ", msg, string(data))
		}
	}

	c.JSON(200, gin.H{"message": "ok"})
}

// PATCH /events/:id/status
func (h *EventHandler) PatchStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		IsActive *bool  `json:"is_active"`
		Reason   string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.IsActive == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "is_active (bool) required"})
		return
	}

	tx := h.db.WithContext(c.Request.Context()).Exec("UPDATE events SET is_active=? WHERE event_id=?", *body.IsActive, id)
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
		return
	}
	if tx.RowsAffected == 0 {
		status := "active"
		if !*body.IsActive {
			status = "suspended"
		}
		if err := h.db.WithContext(c.Request.Context()).Exec("UPDATE events SET status=? WHERE event_id=?", status, id).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot update event status"})
			return
		}
	}

	// หากถูกระงับ ให้แจ้งเจ้าของอีเวนท์ (แก้ ternary เป็น if ปกติ)
	if h.notifUC != nil && body.IsActive != nil && !*body.IsActive {
		if uid, err := h.resolveOwnerUserID(c.Request.Context(), id); err == nil && uid > 0 {
			payload := map[string]any{
				"kind":     "event_suspended",
				"event_id": id,
				"reason":   strings.TrimSpace(body.Reason),
			}
			msg := "อีเวนท์ของคุณถูกระงับโดยผู้ดูแลระบบ"
			if r := strings.TrimSpace(body.Reason); r != "" {
				msg = r
			}
			data, _ := json.Marshal(payload)
			_ = h.notifUC.NotifyUserWithData(c.Request.Context(), uid, "อีเวนท์ถูกระงับ", msg, string(data))
		}
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "event_id": id, "is_active": body.IsActive})
}

// helper: หา user_id เจ้าของอีเวนท์จากตาราง events (user_id หรือ created_by)
func (h *EventHandler) resolveOwnerUserID(ctx context.Context, eventID int) (int, error) {
	if h.db == nil {
		return 0, fmt.Errorf("db not set")
	}
	var uid sql.NullInt64
	// 1) user_id
	if err := h.db.WithContext(ctx).
		Raw("SELECT user_id FROM events WHERE event_id = ? LIMIT 1", eventID).
		Scan(&uid).Error; err == nil && uid.Valid && uid.Int64 > 0 {
		return int(uid.Int64), nil
	}
	// 2) created_by (fallback)
	uid = sql.NullInt64{}
	if err := h.db.WithContext(ctx).
		Raw("SELECT created_by FROM events WHERE event_id = ? LIMIT 1", eventID).
		Scan(&uid).Error; err == nil && uid.Valid && uid.Int64 > 0 {
		return int(uid.Int64), nil
	}
	return 0, fmt.Errorf("owner not found for event_id=%d", eventID)
}
