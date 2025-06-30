package http

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type OrganizerPortfolioImageHandler struct {
	usecase *usecase.OrganizerPortfolioImageUsecase
}

func NewOrganizerPortfolioImageHandler(uc *usecase.OrganizerPortfolioImageUsecase) *OrganizerPortfolioImageHandler {
	return &OrganizerPortfolioImageHandler{uc}
}

// POST /organizer_portfolios/:id/images
func (h *OrganizerPortfolioImageHandler) UploadImages(c *gin.Context) {
	portfolioID, _ := strconv.Atoi(c.Param("id"))
	form, _ := c.MultipartForm()
	files := form.File["images"]
	for _, file := range files {
		filename := filepath.Base(file.Filename)
		dst := fmt.Sprintf("./uploads/%s", filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			img := &entity.OrganizerPortfolioImage{
				PortfolioID: portfolioID,
				ImageURL:    "/uploads/" + filename,
			}
			h.usecase.Create(c.Request.Context(), img)
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "uploaded"})
}

// GET /organizer_portfolios/:id/images
func (h *OrganizerPortfolioImageHandler) GetImages(c *gin.Context) {
	portfolioID, _ := strconv.Atoi(c.Param("id"))
	imgs, _ := h.usecase.GetByPortfolioID(c.Request.Context(), portfolioID)
	c.JSON(http.StatusOK, imgs)
}

// DELETE /organizer_portfolio_images/:image_id
func (h *OrganizerPortfolioImageHandler) DeleteImage(c *gin.Context) {
	imageID, _ := strconv.Atoi(c.Param("image_id"))
	h.usecase.Delete(c.Request.Context(), imageID)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
