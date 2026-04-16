package http

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type VenueReviewHandler struct {
	uc *usecase.VenueReviewUsecase
	db *gorm.DB // used to update venue rating/review_count after create
}

func NewVenueReviewHandler(uc *usecase.VenueReviewUsecase, db *gorm.DB) *VenueReviewHandler {
	return &VenueReviewHandler{uc: uc, db: db}
}

func (h *VenueReviewHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/venues/:id/reviews", h.ListByVenueID)
	r.POST("/venues/:id/reviews", h.Create)
}

func (h *VenueReviewHandler) ListByVenueID(c *gin.Context) {
	id := c.Param("id")
	revs, err := h.uc.GetByVenueID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, revs)
}

func (h *VenueReviewHandler) Create(c *gin.Context) {
	venueIDStr := c.Param("id")
	venueID, err := strconv.Atoi(venueIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	var req struct {
		UserID   int    `json:"user_id"`
		Username string `json:"username,omitempty"`
		Rating   int    `json:"rating"`
		Comment  string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	rv := &entity.VenueReview{
		VenueID:  venueID,
		UserID:   req.UserID,
		Username: req.Username,
		Rating:   req.Rating,
		Comment:  req.Comment,
	}

	if err := h.uc.Create(c.Request.Context(), rv); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// update venue rating and review_count (recompute from DB)
	go func(ctx context.Context, db *gorm.DB, vid int) {
		// best-effort, ignore errors (no blocking)
		var rows []entity.VenueReview
		_ = db.WithContext(ctx).Where("venue_id = ?", vid).Find(&rows).Error
		var sum int
		for _, r := range rows {
			sum += r.Rating
		}
		count := len(rows)
		avg := 0.0
		if count > 0 {
			avg = float64(sum) / float64(count)
		}
		_ = db.WithContext(ctx).Model(&entity.Venue{}).Where("venue_id = ?", vid).
			Updates(map[string]interface{}{"rating": avg, "review_count": count}).Error
	}(c.Request.Context(), h.db, venueID)

	c.JSON(http.StatusCreated, rv)
}
