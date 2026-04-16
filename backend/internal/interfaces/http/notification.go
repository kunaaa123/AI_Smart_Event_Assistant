package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type NotificationHandler struct {
	uc *usecase.NotificationUsecase
}

func NewNotificationHandler(uc *usecase.NotificationUsecase) *NotificationHandler {
	return &NotificationHandler{uc: uc}
}

func (h *NotificationHandler) RegisterRoutes(r *gin.Engine) {
	g := r.Group("/notifications")
	g.GET("", h.listByUser)
	g.PATCH("/:id/read", h.markRead)
	g.POST("/:id/read", h.markRead) // เพิ่ม: รองรับ POST ด้วย
	// เผื่อทดสอบ: สร้างแจ้งเตือนด้วยมือ
	g.POST("", h.create)
}

func (h *NotificationHandler) listByUser(c *gin.Context) {
	userID, _ := strconv.Atoi(c.Query("user_id"))
	if userID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}
	items, err := h.uc.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *NotificationHandler) markRead(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.uc.MarkRead(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) create(c *gin.Context) {
	var n entity.Notification
	if err := c.ShouldBindJSON(&n); err != nil || n.UserID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.uc.Create(c.Request.Context(), &n); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, n)
}
