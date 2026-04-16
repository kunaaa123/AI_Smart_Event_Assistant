package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/gorm"
)

type OrganizerReviewHandler struct {
	usecase *usecase.OrganizerReviewUsecase
	db      *gorm.DB
}

func NewOrganizerReviewHandler(u *usecase.OrganizerReviewUsecase, db *gorm.DB) *OrganizerReviewHandler {
	return &OrganizerReviewHandler{usecase: u, db: db}
}

func (h *OrganizerReviewHandler) Create(c *gin.Context) {
	organizerID, _ := strconv.Atoi(c.Param("id")) // <-- แก้ตรงนี้
	var req struct {
		UserID  int    `json:"user_id"`
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	review := &entity.OrganizerReview{
		OrganizerID: organizerID,
		UserID:      req.UserID,
		Rating:      req.Rating,
		Comment:     req.Comment,
	}
	if err := h.usecase.Create(c.Request.Context(), review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create review"})
		return
	}
	c.JSON(http.StatusCreated, review)
}

func (h *OrganizerReviewHandler) GetByOrganizerID(c *gin.Context) {
	organizerID, _ := strconv.Atoi(c.Param("id"))
	var reviews []OrganizerReviewWithUser

	err := h.db.
		Table("organizer_reviews").
		Select("organizer_reviews.*, users.username, users.profile_image").
		Joins("JOIN users ON organizer_reviews.user_id = users.user_id").
		Where("organizer_reviews.organizer_id = ?", organizerID).
		Order("organizer_reviews.created_at desc").
		Scan(&reviews).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reviews"})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func (h *OrganizerReviewHandler) GetAvgRating(c *gin.Context) {
	organizerID, _ := strconv.Atoi(c.Param("id"))
	avg, count, err := h.usecase.GetAvgRating(c.Request.Context(), organizerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get avg rating"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"avg_rating": avg, "total_reviews": count})
}

func (h *OrganizerReviewHandler) GetAll(c *gin.Context) {
	var reviews []struct {
		entity.OrganizerReview
		Username      string  `json:"username"`
		ProfileImage  *string `json:"profile_image"`
		OrganizerName string  `json:"organizer_name"`
	}
	err := h.db.
		Table("organizer_reviews").
		Select("organizer_reviews.*, users.username, users.profile_image, organizers.expertise as organizer_name").
		Joins("JOIN users ON organizer_reviews.user_id = users.user_id").
		Joins("JOIN organizers ON organizer_reviews.organizer_id = organizers.organizer_id").
		Order("organizer_reviews.created_at desc").
		Scan(&reviews).Error
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch organizer reviews"})
		return
	}
	c.JSON(200, reviews)
}

func (h *OrganizerReviewHandler) DeleteReview(c *gin.Context) {
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

type OrganizerReviewWithUser struct {
	ReviewID     int     `json:"review_id"`
	OrganizerID  int     `json:"organizer_id"`
	UserID       int     `json:"user_id"`
	Rating       int     `json:"rating"`
	Comment      string  `json:"comment"`
	CreatedAt    string  `json:"created_at"`
	Username     string  `json:"username"`
	ProfileImage *string `json:"profile_image"`
}
