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

type VenueHandler struct {
	venueUsecase      *usecase.VenueUsecase
	venueImageUsecase *usecase.VenueImageUsecase
}

func NewVenueHandler(venueUc *usecase.VenueUsecase, venueImageUc *usecase.VenueImageUsecase) *VenueHandler {
	return &VenueHandler{
		venueUsecase:      venueUc,
		venueImageUsecase: venueImageUc,
	}
}

// GET /venues
func (h *VenueHandler) GetAllVenues(c *gin.Context) {
	venues, err := h.venueUsecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, venues)
}

// GET /venues/:id
func (h *VenueHandler) GetVenueByID(c *gin.Context) {
	id := c.Param("id")
	venue, err := h.venueUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venue not found"})
		return
	}
	c.JSON(http.StatusOK, venue)
}

// GET /venues/:id/images
func (h *VenueHandler) GetVenueImages(c *gin.Context) {
	id := c.Param("id")
	images, err := h.venueImageUsecase.GetByVenueID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, images)
}

// POST /venues/:id/images
func (h *VenueHandler) UploadVenueImages(c *gin.Context) {
	venueIDStr := c.Param("id")
	venueIDInt, _ := strconv.Atoi(venueIDStr)

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form or no files"})
		return
	}
	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no images provided"})
		return
	}

	dstBase := UploadsDir
	if dstBase == "" {
		dstBase = "./uploads"
	}
	sub := "venues"
	dstDir := filepath.Join(dstBase, sub)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create uploads dir"})
		return
	}

	// new: support choosing which file is cover
	// If client sends cover_index -> use that index (0-based).
	// If client sends is_cover=true (legacy) -> treat only first file as cover.
	coverIndex := -1
	if idxStr := c.PostForm("cover_index"); idxStr != "" {
		if idx, err := strconv.Atoi(idxStr); err == nil && idx >= 0 {
			coverIndex = idx
		}
	} else if c.PostForm("is_cover") == "true" {
		coverIndex = 0
	}

	type result struct {
		OK   bool   `json:"ok"`
		Name string `json:"name"`
		Err  string `json:"err,omitempty"`
		URL  string `json:"url,omitempty"`
	}
	results := make([]result, 0, len(files))

	var coverURL string

	for i, file := range files {
		newName := NewUniqueFilename(file.Filename)
		dst := filepath.Join(dstDir, newName)

		if err := c.SaveUploadedFile(file, dst); err != nil {
			results = append(results, result{OK: false, Name: file.Filename, Err: err.Error()})
			continue
		}

		urlPath := fmt.Sprintf("/uploads/%s/%s", sub, newName)
		isCover := (coverIndex >= 0 && i == coverIndex)

		img := &entity.VenueImage{
			VenueID:  venueIDInt,
			ImageURL: urlPath,
			IsCover:  isCover,
		}
		if err := h.venueImageUsecase.Create(c.Request.Context(), img); err != nil {
			_ = os.Remove(dst)
			results = append(results, result{OK: false, Name: newName, Err: err.Error()})
			continue
		}

		if isCover {
			// update venue.cover_image to this url (best-effort)
			if v, err := h.venueUsecase.GetByID(c.Request.Context(), venueIDStr); err == nil && v != nil {
				v.CoverImage = urlPath
				_ = h.venueUsecase.Update(c.Request.Context(), v)
			}
			coverURL = urlPath
		}

		results = append(results, result{OK: true, Name: newName, URL: urlPath})
	}

	// Return DB records for this venue so frontend can update UI immediately
	imagesForVenue, _ := h.venueImageUsecase.GetByVenueID(c.Request.Context(), venueIDStr)
	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"images":  imagesForVenue,
		"cover":   coverURL,
	})
}

// GET /venues/popular?limit=6
func (h *VenueHandler) GetPopularVenues(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "6")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 6
	}

	venues, err := h.venueUsecase.GetPopular(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, venues)
}

// POST /venues
func (h *VenueHandler) CreateVenue(c *gin.Context) {
	var venue entity.Venue
	if err := c.ShouldBindJSON(&venue); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.venueUsecase.Create(c.Request.Context(), &venue); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, venue)
}

// PUT /venues/:id
func (h *VenueHandler) UpdateVenue(c *gin.Context) {
	id := c.Param("id")
	venueID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid venue ID"})
		return
	}

	var venue entity.Venue
	if err := c.ShouldBindJSON(&venue); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	venue.VenueID = venueID
	if err := h.venueUsecase.Update(c.Request.Context(), &venue); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, venue)
}

// DELETE /venues/:id
func (h *VenueHandler) DeleteVenue(c *gin.Context) {
	id := c.Param("id")
	if err := h.venueUsecase.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Venue deleted successfully"})
}

// RegisterRoutes registers all venue routes
func (h *VenueHandler) RegisterRoutes(router *gin.Engine) {
	router.GET("/venues", h.GetAllVenues)
	router.GET("/venues/popular", h.GetPopularVenues)
	router.GET("/venues/:id", h.GetVenueByID)
	router.GET("/venues/:id/images", h.GetVenueImages)
	router.POST("/venues/:id/images", h.UploadVenueImages) // <-- new
	router.POST("/venues", h.CreateVenue)
	router.PUT("/venues/:id", h.UpdateVenue)
	router.DELETE("/venues/:id", h.DeleteVenue)
}
