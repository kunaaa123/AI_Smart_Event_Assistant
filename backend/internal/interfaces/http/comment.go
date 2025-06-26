package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type CommentHandler struct {
	commentUsecase *usecase.CommentUsecase
}

func NewCommentHandler(uc *usecase.CommentUsecase) *CommentHandler {
	return &CommentHandler{commentUsecase: uc}
}

func (h *CommentHandler) RegisterRoutes(router *gin.Engine) {
	comments := router.Group("/comments")
	{
		comments.GET("", h.GetAllComments)
		comments.GET("/:id", h.GetComment)
		comments.POST("", h.CreateComment)
		comments.PUT("/:id", h.UpdateComment)
		comments.DELETE("/:id", h.DeleteComment)
	}
}

func (h *CommentHandler) GetAllComments(c *gin.Context) {
	comments, err := h.commentUsecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comments)
}

func (h *CommentHandler) GetComment(c *gin.Context) {
	id := c.Param("id")
	comment, err := h.commentUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comment)
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var comment entity.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.commentUsecase.Create(c.Request.Context(), &comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, comment)
}

func (h *CommentHandler) UpdateComment(c *gin.Context) {
	var comment entity.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.commentUsecase.Update(c.Request.Context(), &comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comment)
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	err := h.commentUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}
