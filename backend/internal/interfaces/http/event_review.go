package http

import (
	"fmt"
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
	if u == nil {
		panic("EventReviewUsecase cannot be nil")
	}
	if db == nil {
		panic("Database connection cannot be nil")
	}
	return &EventReviewHandler{usecase: u, db: db}
}

// ปรับปรุง RegisterRoutes ให้ไม่เกิด panic
func (h *EventReviewHandler) RegisterRoutes(router *gin.Engine) {
	// เอา defer กับ panic check ออก เพราะอาจจะเป็นสาเหตุ
	fmt.Println("Registering EventReview routes...")

	// Register routes แบบง่ายๆ
	router.POST("/events/:id/reviews", h.Create)
	router.GET("/events/:id/reviews", h.GetByEventID)
	router.GET("/events/:id/reviews/avg", h.GetAvgRating)
	router.GET("/users/:user_id/reviews", h.GetUserReviews)
	router.PUT("/events/:id/reviews/:review_id", h.UpdateReview)
	router.DELETE("/events/:id/reviews/:review_id", h.DeleteReview)
	router.GET("/event_reviews", h.GetAll)

	fmt.Println("EventReview routes registered successfully")
}

func (h *EventReviewHandler) Create(c *gin.Context) {
	eventID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	var req struct {
		UserID  int    `json:"user_id"`
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Rating < 1 || req.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be between 1 and 5"})
		return
	}

	if req.UserID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
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
	eventID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	var reviews []EventReviewWithUser

	err = h.db.
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
	eventID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	avg, count, err := h.usecase.GetAvgRating(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get avg rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"avg_rating": avg, "total_reviews": count})
}

func (h *EventReviewHandler) GetUserReviews(c *gin.Context) {
	fmt.Printf("GetUserReviews called with user_id: %s\n", c.Param("user_id"))

	userID, err := strconv.Atoi(c.Param("user_id"))
	if err != nil {
		fmt.Printf("Error parsing user_id: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	fmt.Printf("Parsed user_id: %d\n", userID)

	var reviews []UserReviewWithEvent

	err = h.db.
		Table("event_reviews").
		Select(`
            event_reviews.review_id,
            event_reviews.event_id,
            event_reviews.user_id,
            event_reviews.rating,
            event_reviews.comment,
            event_reviews.created_at,
            events.name as event_name,
            CONCAT(users.first_name, ' ', users.last_name) as organizer_name,
            event_images.image_url as event_image
        `).
		Joins("JOIN events ON event_reviews.event_id = events.event_id").
		Joins("JOIN organizers ON events.organizer_id = organizers.organizer_id").
		Joins("JOIN users ON organizers.user_id = users.user_id").
		Joins("LEFT JOIN event_images ON events.event_id = event_images.event_id AND event_images.is_cover = 1").
		Where("event_reviews.user_id = ?", userID).
		Order("event_reviews.created_at desc").
		Scan(&reviews).Error

	if err != nil {
		fmt.Printf("Database error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user reviews", "details": err.Error()})
		return
	}

	fmt.Printf("Found %d reviews for user %d\n", len(reviews), userID)
	c.JSON(http.StatusOK, reviews)
}

func (h *EventReviewHandler) UpdateReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("review_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	var req struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Rating < 1 || req.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be between 1 and 5"})
		return
	}

	err = h.db.Model(&entity.EventReview{}).
		Where("review_id = ?", reviewID).
		Updates(map[string]interface{}{
			"rating":  req.Rating,
			"comment": req.Comment,
		}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review updated successfully"})
}

func (h *EventReviewHandler) DeleteReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("review_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	err = h.usecase.Delete(c.Request.Context(), reviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review deleted successfully"})
}

func (h *EventReviewHandler) GetAll(c *gin.Context) {
	var reviews []struct {
		entity.EventReview
		Username     string  `json:"username"`
		ProfileImage *string `json:"profile_image"`
		EventName    string  `json:"event_name"`
	}
	err := h.db.
		Table("event_reviews").
		Select("event_reviews.*, users.username, users.profile_image, events.name as event_name").
		Joins("JOIN users ON event_reviews.user_id = users.user_id").
		Joins("JOIN events ON event_reviews.event_id = events.event_id").
		Order("event_reviews.created_at desc").
		Scan(&reviews).Error
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch event reviews"})
		return
	}
	c.JSON(200, reviews)
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

type UserReviewWithEvent struct {
	ReviewID      int     `json:"review_id"`
	EventID       int     `json:"event_id"`
	UserID        int     `json:"user_id"`
	Rating        int     `json:"rating"`
	Comment       string  `json:"comment"`
	CreatedAt     string  `json:"created_at"`
	EventName     string  `json:"event_name"`
	OrganizerName string  `json:"organizer_name"`
	EventImage    *string `json:"event_image"`
}
