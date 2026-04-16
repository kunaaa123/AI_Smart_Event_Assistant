package entity

import (
	"time"

	"gorm.io/gorm"
)

type AIGeneratedImage struct {
	ID              uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID          uint           `json:"user_id" gorm:"not null;index:idx_user_type;type:int"`
	ImageType       string         `json:"image_type" gorm:"type:enum('invitation','theme');not null;index:idx_user_type"`
	AlbumID         *string        `json:"album_id" gorm:"size:50;index:idx_album"`
	Base64Data      string         `json:"base64_data" gorm:"type:longtext;not null"`
	ImageFile       string         `json:"image_file" gorm:"size:255"` // <-- new: relative URL path to saved file (eg. /uploads/ai_generated/themes/...)
	Prompt          string         `json:"prompt" gorm:"type:text;not null"`
	EnhancedPrompt  *string        `json:"enhanced_prompt" gorm:"type:text"`
	ModelUsed       *string        `json:"model_used" gorm:"size:100"`
	VariationNumber int            `json:"variation_number" gorm:"default:1"`
	IsAlbum         bool           `json:"is_album" gorm:"default:false"`
	HasReference    bool           `json:"has_reference" gorm:"default:false"`
	CreatedAt       time.Time      `json:"created_at" gorm:"autoCreateTime;index:idx_created"`
	UpdatedAt       time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign Key Relation (ถ้ามี User table)
	// User User `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (AIGeneratedImage) TableName() string {
	return "ai_generated_images"
}

type AIImageCreateRequest struct {
	UserID          uint   `json:"user_id"`
	ImageType       string `json:"image_type"`
	AlbumID         string `json:"album_id,omitempty"`
	Base64Data      string `json:"base64_data"`
	FilePath        string `json:"file_path,omitempty"` // <-- new optional: "/uploads/ai_generated/themes/..."
	Prompt          string `json:"prompt"`
	EnhancedPrompt  string `json:"enhanced_prompt,omitempty"`
	ModelUsed       string `json:"model_used,omitempty"`
	VariationNumber int    `json:"variation_number"`
	IsAlbum         bool   `json:"is_album"`
	HasReference    bool   `json:"has_reference"`
}

type AIImageResponse struct {
	ID              uint   `json:"id"`
	AlbumID         string `json:"album_id"`
	Base64Data      string `json:"base64_data"`
	Prompt          string `json:"prompt"`
	EnhancedPrompt  string `json:"enhanced_prompt"`
	ModelUsed       string `json:"model_used"`
	VariationNumber int    `json:"variation_number"`
	IsAlbum         bool   `json:"is_album"`
	HasReference    bool   `json:"has_reference"`
	CreatedAt       string `json:"created_at"`
}
