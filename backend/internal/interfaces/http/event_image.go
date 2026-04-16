package http

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type EventImageHandler struct {
	usecase *usecase.EventImageUsecase
}

func NewEventImageHandler(uc *usecase.EventImageUsecase) *EventImageHandler {
	return &EventImageHandler{usecase: uc}
}

// helper: sanitize filename (keep simple)
func sanitizeFilename(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.Map(func(r rune) rune {
		// allow letters, numbers, dot, dash, underscore
		if (r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == '.' || r == '-' || r == '_' {
			return r
		}
		return '-'
	}, name)
	return name
}

// POST /events/:id/images
func (h *EventImageHandler) UploadImages(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	isCover := c.PostForm("is_cover") == "true"
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files"})
		return
	}
	files := form.File["images"]

	dstBase := UploadsDir
	if dstBase == "" {
		dstBase = "./uploads"
	}
	sub := "events"
	dstDir := filepath.Join(dstBase, sub)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create uploads dir"})
		return
	}

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

		img := &entity.EventImage{
			EventID:   eventID,
			ImageURL:  fmt.Sprintf("/uploads/%s/%s", sub, newName),
			IsCover:   isCover,
			CreatedAt: time.Now(),
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

// GET /events/:id/images
func (h *EventImageHandler) GetImages(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	images, err := h.usecase.GetByEventID(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, images)
}

// DELETE /event_images/:image_id
func (h *EventImageHandler) DeleteImage(c *gin.Context) {
	imageID, _ := strconv.Atoi(c.Param("image_id"))
	err := h.usecase.Delete(c.Request.Context(), imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// เพิ่ม RegisterRoutes method
func (h *EventImageHandler) RegisterRoutes(router *gin.Engine) {
	router.POST("/events/:id/images", h.UploadImages)
	router.GET("/events/:id/images", h.GetImages)
	router.DELETE("/event_images/:image_id", h.DeleteImage)
}

// UploadsDir ถูกกำหนดจาก main.go (absolute path)
// ถ้าเป็น empty ให้ handler ใช้ fallback "./uploads"
var UploadsDir string
