package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

type OrganizerHandler struct {
	organizerUsecase *usecase.OrganizerUsecase
	eventUsecase     *usecase.EventUsecase
	userUsecase      *usecase.UserUsecase
}

func NewOrganizerHandler(uc *usecase.OrganizerUsecase, ec *usecase.EventUsecase, uc2 *usecase.UserUsecase) *OrganizerHandler {
	return &OrganizerHandler{organizerUsecase: uc, eventUsecase: ec, userUsecase: uc2}
}

func (h *OrganizerHandler) RegisterRoutes(router *gin.Engine) {
	organizers := router.Group("/organizers")
	{
		organizers.GET("", h.GetAllOrganizers)
		organizers.GET("/:id", h.GetOrganizer)
		organizers.POST("", h.CreateOrganizer)
		organizers.PUT("/:id", h.UpdateOrganizer)
		organizers.DELETE("/:id", h.DeleteOrganizer)
	}
}

func (h *OrganizerHandler) GetAllOrganizers(c *gin.Context) {
	var organizers []entity.OrganizerWithName
	err := h.organizerUsecase.GetAllWithName(c.Request.Context(), &organizers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, organizers)
}

func (h *OrganizerHandler) GetOrganizer(c *gin.Context) {
	id := c.Param("id")
	organizer, err := h.organizerUsecase.GetByID(c.Request.Context(), id)
	if err != nil || organizer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organizer not found"})
		return
	}

	// ดึง user ที่เกี่ยวข้อง
	user, err := h.userUsecase.GetByID(c.Request.Context(), fmt.Sprintf("%d", organizer.UserID))
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// รวมข้อมูล organizer + user
	resp := map[string]interface{}{
		"organizer_id":  organizer.OrganizerID,
		"user_id":       organizer.UserID,
		"portfolio_img": organizer.PortfolioImg,
		"expertise":     organizer.Expertise,
		"created_at":    organizer.CreatedAt,
		"first_name":    user.FirstName,
		"last_name":     user.LastName,
		"profile_image": user.ProfileImage,
		"bio":           user.Bio,
		// เพิ่ม field อื่นๆ ตามต้องการ
	}
	c.JSON(http.StatusOK, resp)
}

func (h *OrganizerHandler) CreateOrganizer(c *gin.Context) {
	var organizer entity.Organizer
	if err := c.ShouldBind(&organizer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	file, err := c.FormFile("portfolio_img")
	if err == nil && file != nil {
		filename := fmt.Sprintf("organizer_%d_%s", organizer.UserID, file.Filename)
		dst := fmt.Sprintf("./uploads/%s", filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			path := "/uploads/" + filename
			organizer.PortfolioImg = &path
		}
	}
	err = h.organizerUsecase.Create(c.Request.Context(), &organizer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, organizer)
}

func (h *OrganizerHandler) UpdateOrganizer(c *gin.Context) {
	var organizer entity.Organizer
	if err := c.ShouldBindJSON(&organizer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.organizerUsecase.Update(c.Request.Context(), &organizer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, organizer)
}

func (h *OrganizerHandler) DeleteOrganizer(c *gin.Context) {
	id := c.Param("id")
	err := h.organizerUsecase.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Organizer deleted successfully"})
}

func (h *OrganizerHandler) CreateEvent(c *gin.Context) {
	var event entity.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	organizerIDStr := c.PostForm("organizer_id")
	if organizerIDStr != "" {
		fmt.Sscanf(organizerIDStr, "%d", &event.OrganizerID)
	}
	err := h.eventUsecase.Create(c.Request.Context(), &event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, event)
	file, err := c.FormFile("event_image")
	if err == nil && file != nil {
		filename := fmt.Sprintf("event_%d_%s", event.OrganizerID, file.Filename)
		dst := fmt.Sprintf("./uploads/%s", filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			event.EventImage = &dst // หรือ "/uploads/..." ถ้าต้องการ path แบบ relative
		}
	}
}
