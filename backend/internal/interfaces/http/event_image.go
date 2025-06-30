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

type EventImageHandler struct {
	usecase *usecase.EventImageUsecase
}

func NewEventImageHandler(uc *usecase.EventImageUsecase) *EventImageHandler {
	return &EventImageHandler{uc}
}

// POST /events/:id/images
func (h *EventImageHandler) UploadImages(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	isCover := c.PostForm("is_cover") == "true"
	form, _ := c.MultipartForm()
	files := form.File["images"]
	for _, file := range files {
		filename := filepath.Base(file.Filename)
		dst := fmt.Sprintf("./uploads/%s", filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			img := &entity.EventImage{
				EventID:  eventID,
				ImageURL: "/uploads/" + filename,
				IsCover:  isCover,
			}
			h.usecase.Create(c.Request.Context(), img)
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "uploaded"})
}

// GET /events/:id/images
func (h *EventImageHandler) GetImages(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	imgs, _ := h.usecase.GetByEventID(c.Request.Context(), eventID)
	c.JSON(http.StatusOK, imgs)
}

// DELETE /event_images/:image_id
func (h *EventImageHandler) DeleteImage(c *gin.Context) {
	imageID, _ := strconv.Atoi(c.Param("image_id"))
	h.usecase.Delete(c.Request.Context(), imageID)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
