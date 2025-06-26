package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type RequestOrganizerHandler struct {
	usecase *usecase.RequestOrganizerUsecase
}

func NewRequestOrganizerHandler(uc *usecase.RequestOrganizerUsecase) *RequestOrganizerHandler {
	return &RequestOrganizerHandler{usecase: uc}
}

func (h *RequestOrganizerHandler) RegisterRoutes(router *gin.Engine) {
	reqs := router.Group("/request_organizers")
	{
		reqs.GET("", h.GetAll)
		reqs.GET("/:id", h.GetByID)
		reqs.POST("", h.Create)
		reqs.PUT("/:id", h.Update)
		reqs.DELETE("/:id", h.Delete)
	}
}

func (h *RequestOrganizerHandler) GetAll(c *gin.Context) {
	reqs, err := h.usecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reqs)
}

func (h *RequestOrganizerHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	req, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *RequestOrganizerHandler) Create(c *gin.Context) {
	var req struct {
		UserID        int    `json:"user_id"`
		OrganizerName string `json:"organizer_name"`
		Category      string `json:"category"`
		Email         string `json:"email"`
		Price         string `json:"price"`
		Phone         string `json:"phone"`
		Description   string `json:"description"`
		ImageLabel    string `json:"imageLabel"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	request := entity.RequestOrganizer{
		UserID:        req.UserID,
		OrganizerName: req.OrganizerName,
		Category:      req.Category,
		Email:         req.Email,
		Price:         req.Price,
		Phone:         req.Phone,
		Description:   req.Description,
		ImageLabel:    req.ImageLabel,
	}

	if err := h.usecase.Create(c.Request.Context(), &request); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Request submitted successfully"})
}

func (h *RequestOrganizerHandler) Update(c *gin.Context) {
	var req entity.RequestOrganizer
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.usecase.Update(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *RequestOrganizerHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.usecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "RequestOrganizer deleted successfully"})
}
