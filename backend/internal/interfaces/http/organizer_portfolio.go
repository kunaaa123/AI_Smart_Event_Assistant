package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type OrganizerPortfolioHandler struct {
	usecase *usecase.OrganizerPortfolioUsecase
}

func NewOrganizerPortfolioHandler(uc *usecase.OrganizerPortfolioUsecase) *OrganizerPortfolioHandler {
	return &OrganizerPortfolioHandler{usecase: uc}
}

func (h *OrganizerPortfolioHandler) RegisterRoutes(router *gin.Engine) {
	portfolios := router.Group("/organizer_portfolios")
	{
		portfolios.POST("", h.Create)
		portfolios.GET("", h.GetAll)
		portfolios.GET("/:id", h.GetByID)
		portfolios.PUT("/:id", h.Update)
		portfolios.DELETE("/:id", h.Delete)
		portfolios.GET("/organizer/:organizer_id", h.GetByOrganizerID)
	}
}

func (h *OrganizerPortfolioHandler) Create(c *gin.Context) {
	var portfolio entity.OrganizerPortfolio

	portfolio.Title = c.PostForm("title")
	portfolio.Description = c.PostForm("description")
	portfolio.Category = c.PostForm("category")
	portfolio.Price = c.PostForm("price")
	organizerIDStr := c.PostForm("organizer_id")
	if organizerIDStr != "" {
		fmt.Sscanf(organizerIDStr, "%d", &portfolio.OrganizerID)
	}

	// รับไฟล์
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		filename := file.Filename
		dst := fmt.Sprintf("./uploads/%s", filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			portfolio.ImageURL = "/uploads/" + filename
		}
	}

	// validate ตามต้องการ...

	err = h.usecase.Create(c.Request.Context(), &portfolio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, portfolio)
}

func (h *OrganizerPortfolioHandler) GetAll(c *gin.Context) {
	portfolios, err := h.usecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, portfolios)
}

func (h *OrganizerPortfolioHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	portfolio, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, portfolio)
}

func (h *OrganizerPortfolioHandler) Update(c *gin.Context) {
	var portfolio entity.OrganizerPortfolio
	if err := c.ShouldBindJSON(&portfolio); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.usecase.Update(c.Request.Context(), &portfolio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, portfolio)
}

func (h *OrganizerPortfolioHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.usecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Portfolio deleted successfully"})
}

func (h *OrganizerPortfolioHandler) GetByOrganizerID(c *gin.Context) {
	organizerID := c.Param("organizer_id")
	portfolios, err := h.usecase.GetByOrganizerID(c.Request.Context(), organizerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, portfolios)
}
