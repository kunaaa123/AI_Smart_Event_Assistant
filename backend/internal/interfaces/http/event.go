package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type EventHandler struct {
	eventUsecase *usecase.EventUsecase
}

func NewEventHandler(uc *usecase.EventUsecase) *EventHandler {
	return &EventHandler{eventUsecase: uc}
}

func (h *EventHandler) RegisterRoutes(router *gin.Engine) {
	events := router.Group("/events")
	{
		events.POST("", h.CreateEvent)
		events.GET("", h.GetAllWithStats) // ให้ /events ใช้ handler นี้
		events.GET("/:id", h.GetEvent)
		events.GET("/user/:user_id", h.GetEventsByUserID)
	}
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

func (h *EventHandler) CreateEvent(c *gin.Context) {
	var event entity.Event

	event.Name = c.PostForm("name")
	event.Description = c.PostForm("description")
	organizerIDStr := c.PostForm("organizer_id")
	if organizerIDStr != "" {
		fmt.Sscanf(organizerIDStr, "%d", &event.OrganizerID)
	}
	userIDStr := c.PostForm("user_id")
	if userIDStr != "" {
		fmt.Sscanf(userIDStr, "%d", &event.UserID)
	}

	// รับไฟล์
	file, err := c.FormFile("event_image")
	if err == nil && file != nil {
		// สมมติบันทึกไฟล์ไว้ที่ ./uploads/
		dst := fmt.Sprintf("./uploads/%s", file.Filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			event.EventImage = &dst
		}
	}

	// ...validate event.Name, event.Description...

	// สร้าง event ในฐานข้อมูล
	err = h.eventUsecase.Create(c.Request.Context(), &event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, event)
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
	events, err := h.eventUsecase.GetByUserID(c.Request.Context(), userID)
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
