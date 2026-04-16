package http

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type AIGeneratedImageHandler struct {
	usecase *usecase.AIGeneratedImageUsecase
}

func NewAIGeneratedImageHandler(uc *usecase.AIGeneratedImageUsecase) *AIGeneratedImageHandler {
	return &AIGeneratedImageHandler{usecase: uc}
}

// POST /ai-generated-images/save
func (h *AIGeneratedImageHandler) SaveImages(c *gin.Context) {
	var requests []*entity.AIImageCreateRequest
	if err := c.ShouldBindJSON(&requests); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ensure UploadsDir is set (main.go จะเซ็ตให้)
	base := UploadsDir
	if base == "" {
		base = "./uploads"
	}

	for i, req := range requests {
		// normalize type
		t := strings.ToLower(req.ImageType)
		if t != "theme" && t != "invitation" {
			t = "invitation" // fallback
		}
		typeDir := "invitations"
		if t == "theme" {
			typeDir = "themes"
		}

		// if base64 present -> decode and save to disk
		if strings.TrimSpace(req.Base64Data) != "" {
			data, err := base64.StdEncoding.DecodeString(req.Base64Data)
			if err == nil && len(data) > 0 {
				sub := filepath.Join(base, "ai_generated", typeDir)
				_ = os.MkdirAll(sub, 0755)
				// use NewUniqueFilename helper (creates sanitized uuid+timestamp names)
				name := NewUniqueFilename(fmt.Sprintf("%s.png", t))
				dst := filepath.Join(sub, name)
				if writeErr := os.WriteFile(dst, data, 0644); writeErr == nil {
					// set file path for usecase to persist
					requests[i].FilePath = fmt.Sprintf("/uploads/ai_generated/%s/%s", typeDir, name)
					// optionally clear Base64Data to save DB space (comment out if want to keep)
					// requests[i].Base64Data = ""
				} else {
					// log but continue: DB still gets base64 if write fails
					fmt.Printf("failed to write ai image file: %v\n", writeErr)
				}
			} else {
				fmt.Printf("invalid base64 for request index %d: %v\n", i, err)
			}
		}
	}

	// now call usecase to save records (use FilePath if set)
	err := h.usecase.SaveImages(c.Request.Context(), requests)
	if err != nil {
		// เพิ่ม log เพื่อดูสาเหตุจริง
		fmt.Printf("SaveImages handler: failed to save images: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Images saved successfully",
		"count":   len(requests),
	})
}

// GET /ai-generated-images/user/:user_id/:type
func (h *AIGeneratedImageHandler) GetUserImages(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	imageType := c.Param("type") // "invitation" or "theme"
	if imageType != "invitation" && imageType != "theme" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image type"})
		return
	}

	images, err := h.usecase.GetUserImages(c.Request.Context(), uint(userID), imageType)
	if err != nil {
		// Log error สำหรับ debug
		fmt.Printf("Error getting user images: %v\n", err)

		// Return empty array แทน error เพื่อให้ frontend ทำงานได้
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"images":  []*entity.AIImageResponse{},
			"count":   0,
		})
		return
	}

	// ถ้า images เป็น nil ให้เซ็ตเป็น empty array
	if images == nil {
		images = []*entity.AIImageResponse{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"images":  images,
		"count":   len(images),
	})
}

// GET /ai-generated-images/album/:album_id
func (h *AIGeneratedImageHandler) GetAlbumImages(c *gin.Context) {
	albumID := c.Param("album_id")

	images, err := h.usecase.GetAlbumImages(c.Request.Context(), albumID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"images":  images,
		"count":   len(images),
	})
}

// DELETE /ai-generated-images/:id
func (h *AIGeneratedImageHandler) DeleteImage(c *gin.Context) {
	imageID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	userID, err := strconv.ParseUint(c.Query("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID required"})
		return
	}

	err = h.usecase.DeleteImage(c.Request.Context(), uint(imageID), uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Image deleted successfully",
	})
}

// DELETE /ai-generated-images/album/:album_id
func (h *AIGeneratedImageHandler) DeleteAlbum(c *gin.Context) {
	albumID := c.Param("album_id")

	userID, err := strconv.ParseUint(c.Query("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID required"})
		return
	}

	err = h.usecase.DeleteAlbum(c.Request.Context(), albumID, uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Album deleted successfully",
	})
}
