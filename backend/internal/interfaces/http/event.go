package http

import (
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
		events.GET("", h.GetAllEvents)
		events.GET("/:id", h.GetEvent)
		events.POST("", h.CreateEvent)
		events.PUT("/:id", h.UpdateEvent)
		events.DELETE("/:id", h.DeleteEvent)
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
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.eventUsecase.Create(c.Request.Context(), &event)
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
