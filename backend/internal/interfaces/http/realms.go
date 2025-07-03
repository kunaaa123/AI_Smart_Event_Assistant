package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	"gorm.io/gorm"
)

// RealmHandler handles requests related to realms
type RealmHandler struct {
	db *gorm.DB
}

// NewRealmHandler creates a new RealmHandler
func NewRealmHandler(db *gorm.DB) *RealmHandler {
	return &RealmHandler{db: db}
}

// GET /realms?owner_id=...
func (h *RealmHandler) GetRealmsByOwner(c *gin.Context) {
	ownerID := c.Query("owner_id")
	if ownerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "owner_id is required"})
		return
	}
	var realms []entity.Realm
	if err := h.db.Where("owner_id = ?", ownerID).Find(&realms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch realms"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"realms": realms})
}

// POST /realms
func (h *RealmHandler) CreateRealm(c *gin.Context) {
	var req struct {
		OwnerID int         `json:"owner_id"`
		Name    string      `json:"name"`
		MapData interface{} `json:"map_data"` // รับเป็น JSON
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	realm := entity.Realm{
		OwnerID: req.OwnerID,
		Name:    req.Name,
	}
	// แปลง map_data เป็น json.RawMessage
	if req.MapData != nil {
		bytes, _ := json.Marshal(req.MapData)
		realm.MapData = json.RawMessage(bytes) // ✅ ถูก type
	}
	if err := h.db.Create(&realm).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create realm"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": realm.ID})
}

// GET /realms/:id
func (h *RealmHandler) GetRealmByID(c *gin.Context) {
	idStr := c.Param("id")
	fmt.Printf("[REALM-DEBUG] GetRealmByID called with id=%s\n", idStr)
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Printf("[REALM-DEBUG] Invalid id: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var realm entity.Realm
	if err := h.db.First(&realm, id).Error; err != nil {
		fmt.Printf("[REALM-DEBUG] db.First error: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Realm not found"})
		return
	}
	fmt.Printf("[REALM-DEBUG] realm.ID=%d, map_data=%s\n", realm.ID, string(realm.MapData))
	c.JSON(http.StatusOK, gin.H{
		"id":         realm.ID,
		"owner_id":   realm.OwnerID,
		"name":       realm.Name,
		"map_data":   realm.MapData, // <-- ตรงนี้ถ้าเป็น json.RawMessage จะถูกต้อง
		"share_id":   realm.ShareID,
		"only_owner": realm.OnlyOwner,
	})
}

// PUT /realms/:id
func (h *RealmHandler) UpdateRealm(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var req struct {
		MapData interface{} `json:"map_data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	var realm entity.Realm
	if err := h.db.First(&realm, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Realm not found"})
		return
	}
	if req.MapData != nil {
		bytes, _ := json.Marshal(req.MapData)
		realm.MapData = json.RawMessage(bytes)
	}
	if err := h.db.Save(&realm).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update realm"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Realm updated"})
}
