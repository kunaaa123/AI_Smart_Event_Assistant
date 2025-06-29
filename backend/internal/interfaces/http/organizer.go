package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type OrganizerHandler struct {
	organizerUsecase *usecase.OrganizerUsecase
	eventUsecase     *usecase.EventUsecase
}

func NewOrganizerHandler(uc *usecase.OrganizerUsecase, ec *usecase.EventUsecase) *OrganizerHandler {
	return &OrganizerHandler{organizerUsecase: uc, eventUsecase: ec}
}

func (h *OrganizerHandler) RegisterRoutes(router *gin.Engine) {
	organizers := router.Group("/organizers")
	{
		organizers.GET("", h.GetAllOrganizers)
		organizers.GET("/:id", h.GetOrganizer)
		organizers.POST("", h.CreateOrganizer)
		organizers.PUT("/:id", h.UpdateOrganizer)
		organizers.DELETE("/:id", h.DeleteOrganizer)
	}
}

func (h *OrganizerHandler) GetAllOrganizers(c *gin.Context) {
	var organizers []entity.OrganizerWithName
	err := h.organizerUsecase.GetAllWithName(c.Request.Context(), &organizers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, organizers)
}

func (h *OrganizerHandler) GetOrganizer(c *gin.Context) {
	id := c.Param("id")
	organizer, err := h.organizerUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, organizer)
}

func (h *OrganizerHandler) CreateOrganizer(c *gin.Context) {
	var organizer entity.Organizer
	if err := c.ShouldBindJSON(&organizer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.organizerUsecase.Create(c.Request.Context(), &organizer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, organizer)
}

func (h *OrganizerHandler) UpdateOrganizer(c *gin.Context) {
	var organizer entity.Organizer
	if err := c.ShouldBindJSON(&organizer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.organizerUsecase.Update(c.Request.Context(), &organizer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, organizer)
}

func (h *OrganizerHandler) DeleteOrganizer(c *gin.Context) {
	id := c.Param("id")
	err := h.organizerUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Organizer deleted successfully"})
}

func (h *OrganizerHandler) CreateEvent(c *gin.Context) {
	var event entity.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	organizerIDStr := c.PostForm("organizer_id")
	if organizerIDStr != "" {
		fmt.Sscanf(organizerIDStr, "%d", &event.OrganizerID)
	}
	err := h.eventUsecase.Create(c.Request.Context(), &event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, event)
}
