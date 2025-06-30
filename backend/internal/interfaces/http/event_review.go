package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type EventReviewHandler struct {
	usecase *usecase.EventReviewUsecase
	db      *gorm.DB
}

func NewEventReviewHandler(u *usecase.EventReviewUsecase, db *gorm.DB) *EventReviewHandler {
	return &EventReviewHandler{usecase: u, db: db}
}

func (h *EventReviewHandler) RegisterRoutes(router *gin.Engine) {
	router.POST("/events/:id/reviews", h.Create)
	router.GET("/events/:id/reviews", h.GetByEventID)
	router.GET("/events/:id/reviews/avg", h.GetAvgRating)
}

func (h *EventReviewHandler) Create(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id")) // <-- ต้องใช้ "id" ไม่ใช่ "event_id"
	var req struct {
		UserID  int    `json:"user_id"`
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	review := &entity.EventReview{
		EventID: eventID,
		UserID:  req.UserID,
		Rating:  req.Rating,
		Comment: req.Comment,
	}
	if err := h.usecase.Create(c.Request.Context(), review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create review"})
		return
	}
	c.JSON(http.StatusCreated, review)
}

func (h *EventReviewHandler) GetByEventID(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	var reviews []EventReviewWithUser

	// JOIN reviews กับ users
	err := h.db.
		Table("event_reviews").
		Select("event_reviews.*, users.username, users.profile_image").
		Joins("JOIN users ON event_reviews.user_id = users.user_id").
		Where("event_reviews.event_id = ?", eventID).
		Order("event_reviews.created_at desc").
		Scan(&reviews).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reviews"})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func (h *EventReviewHandler) GetAvgRating(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("event_id"))
	avg, count, err := h.usecase.GetAvgRating(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get avg rating"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"avg_rating": avg, "total_reviews": count})
}

type EventReviewWithUser struct {
	ReviewID     int     `json:"review_id"`
	EventID      int     `json:"event_id"`
	UserID       int     `json:"user_id"`
	Rating       int     `json:"rating"`
	Comment      string  `json:"comment"`
	CreatedAt    string  `json:"created_at"`
	Username     string  `json:"username"`
	ProfileImage *string `json:"profile_image"`
}
