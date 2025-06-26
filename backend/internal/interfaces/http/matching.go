package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type MatchingHandler struct {
	matchingUsecase *usecase.MatchingUsecase
}

func NewMatchingHandler(uc *usecase.MatchingUsecase) *MatchingHandler {
	return &MatchingHandler{matchingUsecase: uc}
}

func (h *MatchingHandler) RegisterRoutes(router *gin.Engine) {
	matchings := router.Group("/matchings")
	{
		matchings.GET("", h.GetAllMatchings)
		matchings.GET("/:id", h.GetMatching)
		matchings.POST("", h.CreateMatching)
		matchings.PUT("/:id", h.UpdateMatching)
		matchings.DELETE("/:id", h.DeleteMatching)
	}
}

func (h *MatchingHandler) GetAllMatchings(c *gin.Context) {
	matchings, err := h.matchingUsecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, matchings)
}

func (h *MatchingHandler) GetMatching(c *gin.Context) {
	id := c.Param("id")
	matching, err := h.matchingUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, matching)
}

func (h *MatchingHandler) CreateMatching(c *gin.Context) {
	var matching entity.Matching
	if err := c.ShouldBindJSON(&matching); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.matchingUsecase.Create(c.Request.Context(), &matching)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, matching)
}

func (h *MatchingHandler) UpdateMatching(c *gin.Context) {
	var matching entity.Matching
	if err := c.ShouldBindJSON(&matching); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.matchingUsecase.Update(c.Request.Context(), &matching)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, matching)
}

func (h *MatchingHandler) DeleteMatching(c *gin.Context) {
	id := c.Param("id")
	err := h.matchingUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Matching deleted successfully"})
}
