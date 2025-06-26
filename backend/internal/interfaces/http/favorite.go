package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type FavoriteHandler struct {
	favoriteUsecase *usecase.FavoriteUsecase
}

func NewFavoriteHandler(uc *usecase.FavoriteUsecase) *FavoriteHandler {
	return &FavoriteHandler{favoriteUsecase: uc}
}

func (h *FavoriteHandler) RegisterRoutes(router *gin.Engine) {
	favorites := router.Group("/favorites")
	{
		favorites.GET("", h.GetAllFavorites)
		favorites.GET("/:id", h.GetFavorite)
		favorites.POST("", h.CreateFavorite)
		favorites.PUT("/:id", h.UpdateFavorite)
		favorites.DELETE("/:id", h.DeleteFavorite)
	}
}

func (h *FavoriteHandler) GetAllFavorites(c *gin.Context) {
	favorites, err := h.favoriteUsecase.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, favorites)
}

func (h *FavoriteHandler) GetFavorite(c *gin.Context) {
	id := c.Param("id")
	favorite, err := h.favoriteUsecase.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, favorite)
}

func (h *FavoriteHandler) CreateFavorite(c *gin.Context) {
	var favorite entity.Favorite
	if err := c.ShouldBindJSON(&favorite); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.favoriteUsecase.Create(c.Request.Context(), &favorite)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, favorite)
}

func (h *FavoriteHandler) UpdateFavorite(c *gin.Context) {
	var favorite entity.Favorite
	if err := c.ShouldBindJSON(&favorite); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.favoriteUsecase.Update(c.Request.Context(), &favorite)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, favorite)
}

func (h *FavoriteHandler) DeleteFavorite(c *gin.Context) {
	id := c.Param("id")
	err := h.favoriteUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Favorite deleted successfully"})
}
