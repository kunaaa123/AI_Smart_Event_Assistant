package http

import (
	"fmt"
	"net/http"
	"os"
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
	return &OrganizerPortfolioImageHandler{usecase: uc}
}

// POST /organizer_portfolios/:id/images
func (h *OrganizerPortfolioImageHandler) UploadImages(c *gin.Context) {
	portfolioID, _ := strconv.Atoi(c.Param("id"))
	form, _ := c.MultipartForm()
	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no images"})
		return
	}

	dstBase := UploadsDir
	if dstBase == "" {
		dstBase = "./uploads"
	}
	sub := "organizer_portfolios"
	dstDir := filepath.Join(dstBase, sub)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create uploads dir"})
		return
	}

	isCover := c.PostForm("is_cover") == "true"

	type result struct {
		OK   bool
		Name string
		Err  string
	}
	results := make([]result, 0, len(files))

	for _, file := range files {
		newName := NewUniqueFilename(file.Filename)
		dst := filepath.Join(dstDir, newName)

		if err := c.SaveUploadedFile(file, dst); err != nil {
			results = append(results, result{OK: false, Name: file.Filename, Err: err.Error()})
			continue
		}

		img := &entity.OrganizerPortfolioImage{
			PortfolioID: portfolioID,
			ImageURL:    fmt.Sprintf("/uploads/%s/%s", sub, newName),
			IsCover:     isCover,
		}
		if err := h.usecase.Create(c.Request.Context(), img); err != nil {
			_ = os.Remove(dst)
			results = append(results, result{OK: false, Name: newName, Err: err.Error()})
			continue
		}
		results = append(results, result{OK: true, Name: newName})
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}

// GET /organizer_portfolios/:id/images
func (h *OrganizerPortfolioImageHandler) GetImages(c *gin.Context) {
	portfolioID, _ := strconv.Atoi(c.Param("id"))
	images, err := h.usecase.GetByPortfolioID(c.Request.Context(), portfolioID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, images)
}

// DELETE /organizer_portfolio_images/:image_id
func (h *OrganizerPortfolioImageHandler) DeleteImage(c *gin.Context) {
	imageID, _ := strconv.Atoi(c.Param("image_id"))
	err := h.usecase.Delete(c.Request.Context(), imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// เพิ่ม RegisterRoutes method
func (h *OrganizerPortfolioImageHandler) RegisterRoutes(router *gin.Engine) {
	router.POST("/organizer_portfolios/:id/images", h.UploadImages)
	router.GET("/organizer_portfolios/:id/images", h.GetImages)
	router.DELETE("/organizer_portfolio_images/:image_id", h.DeleteImage)
}
