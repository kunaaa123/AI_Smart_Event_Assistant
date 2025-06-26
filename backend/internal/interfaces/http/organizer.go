package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type OrganizerHandler struct {
	organizerUsecase *usecase.OrganizerUsecase
}

func NewOrganizerHandler(uc *usecase.OrganizerUsecase) *OrganizerHandler {
	return &OrganizerHandler{organizerUsecase: uc}
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
	organizers, err := h.organizerUsecase.GetAll(c.Request.Context())
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
