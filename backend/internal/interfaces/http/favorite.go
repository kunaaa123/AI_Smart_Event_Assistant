package http

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type FavoriteHandler struct {
	favoriteUsecase usecase.FavoriteUsecase
}

func NewFavoriteHandler(favoriteUsecase usecase.FavoriteUsecase) *FavoriteHandler {
	return &FavoriteHandler{
		favoriteUsecase: favoriteUsecase,
	}
}

// POST /favorites
func (h *FavoriteHandler) AddToFavorites(c *gin.Context) {
	var req struct {
		UserID  int `json:"user_id" binding:"required"`
		EventID int `json:"event_id" binding:"required"`
	}

	// Debug: ดูข้อมูลที่เข้ามา
	fmt.Printf("[FAVORITE] Raw body: %v\n", c.Request.Body)

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("[FAVORITE] Bind error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	fmt.Printf("[FAVORITE] Parsed request: UserID=%d, EventID=%d\n", req.UserID, req.EventID)

	// ตรวจสอบค่าที่จำเป็น
	if req.UserID <= 0 || req.EventID <= 0 {
		fmt.Printf("[FAVORITE] Invalid IDs: UserID=%d, EventID=%d\n", req.UserID, req.EventID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserID and EventID must be positive integers"})
		return
	}

	err := h.favoriteUsecase.AddToFavorites(c.Request.Context(), req.UserID, req.EventID)
	if err != nil {
		fmt.Printf("[FAVORITE] Usecase error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("[FAVORITE] Success: UserID=%d, EventID=%d\n", req.UserID, req.EventID)
	c.JSON(http.StatusCreated, gin.H{"message": "เพิ่มรายการโปรดสำเร็จ"})
}

// DELETE /favorites
func (h *FavoriteHandler) RemoveFromFavorites(c *gin.Context) {
	var req struct {
		UserID  int `json:"user_id" binding:"required"`
		EventID int `json:"event_id" binding:"required"`
	}

	fmt.Printf("[FAVORITE] Remove request received\n")

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("[FAVORITE] Remove bind error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	fmt.Printf("[FAVORITE] Remove parsed: UserID=%d, EventID=%d\n", req.UserID, req.EventID)

	if req.UserID <= 0 || req.EventID <= 0 {
		fmt.Printf("[FAVORITE] Remove invalid IDs: UserID=%d, EventID=%d\n", req.UserID, req.EventID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserID and EventID must be positive integers"})
		return
	}

	err := h.favoriteUsecase.RemoveFromFavorites(c.Request.Context(), req.UserID, req.EventID)
	if err != nil {
		fmt.Printf("[FAVORITE] Remove usecase error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("[FAVORITE] Remove success: UserID=%d, EventID=%d\n", req.UserID, req.EventID)
	c.JSON(http.StatusOK, gin.H{"message": "ลบรายการโปรดสำเร็จ"})
}

// GET /favorites/user/:user_id
func (h *FavoriteHandler) GetUserFavorites(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	favorites, err := h.favoriteUsecase.GetUserFavorites(c.Request.Context(), userID)
	if err != nil {
		fmt.Printf("[FAVORITE] GetUserFavorites error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Debug: ตรวจสอบข้อมูลที่จะส่งกลับ
	fmt.Printf("[FAVORITE] Returning %d favorites for user %d\n", len(favorites), userID)
	for i, fav := range favorites {
		fmt.Printf("[FAVORITE] Favorite %d: ID=%d, UserID=%d, EventID=%d\n",
			i, fav.FavoriteID, fav.UserID, fav.EventID)
		if fav.Event.EventID != 0 {
			fmt.Printf("[FAVORITE] Event: ID=%d, Name=%s\n",
				fav.Event.EventID, fav.Event.Name)
		}
	}

	c.JSON(http.StatusOK, favorites)
}

// GET /favorites/check/:user_id/:event_id
func (h *FavoriteHandler) CheckIsFavorite(c *gin.Context) {
	userIDStr := c.Param("user_id")
	eventIDStr := c.Param("event_id")

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	isFavorite, err := h.favoriteUsecase.CheckIsFavorite(c.Request.Context(), userID, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_favorite": isFavorite})
}

func (h *FavoriteHandler) RegisterRoutes(router *gin.Engine) {
	router.POST("/favorites", h.AddToFavorites)
	router.DELETE("/favorites", h.RemoveFromFavorites)
	router.GET("/favorites/user/:user_id", h.GetUserFavorites)
	router.GET("/favorites/check/:user_id/:event_id", h.CheckIsFavorite)
}
