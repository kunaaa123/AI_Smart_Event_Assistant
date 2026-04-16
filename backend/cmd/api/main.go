package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	persistence "github.com/kunaaa123/smart-ai-event-assistant/backend/internal/infrastructure/persistence"
	httpHandler "github.com/kunaaa123/smart-ai-event-assistant/backend/internal/interfaces/http"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
)

var (
	db           *gorm.DB      // Global DB
	emailService *EmailService // Global EmailService
)

type approvalMailer struct{}

// ทำหน้าที่ส่งอีเมลแบบง่าย โดยใช้ EmailService ภายในแพ็กเกจ main
func (approvalMailer) Send(to, subject, html string) error {
	// ใช้ plain เป็น text fallback
	plain := stripHTML(html)
	return emailService.sendSimpleEmail(to, subject, htmlOrPlain(html, plain))
}

// htmlOrPlain: ถ้า html ว่างให้ใช้ plain
func htmlOrPlain(html, plain string) string {
	if strings.TrimSpace(html) == "" {
		return plain
	}
	return html
}

// ลบคีย์จริงออกจากซอร์ส (ควรย้ายไป .env)
// const (
// 	SENDGRID_API_KEY = "HARDCODED_REMOVE"
// 	FROM_EMAIL       = "singha20032546@gmail.com"
// )

// เพิ่ม helper โหลด .env หลายตำแหน่ง
func loadEnvMulti() {
	paths := []string{
		".env",
		"../.env",
		"../../.env",
		filepath.Join("..", "..", ".env"),
	}
	loaded := false
	for _, p := range paths {
		if err := godotenv.Load(p); err == nil {
			log.Println("✅ loaded env file:", p)
			loaded = true
			break
		}
	}
	if !loaded {
		log.Println("⚠️  no .env file loaded (falling back to OS environment)")
	}
}

func setupDatabase() *gorm.DB {
	// ลองหลายแบบ
	dsnOptions := []string{
		"root:@tcp(127.0.0.1:3306)/AI_Smart_Event_Assistant?charset=utf8mb4&parseTime=True&loc=Local",
		"root@tcp(127.0.0.1:3306)/AI_Smart_Event_Assistant?charset=utf8mb4&parseTime=True&loc=Local",
		"root:root@tcp(127.0.0.1:3306)/AI_Smart_Event_Assistant?charset=utf8mb4&parseTime=True&loc=Local",
	}

	for i, dsn := range dsnOptions {
		log.Printf("Attempting database connection #%d...", i+1)
		db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err == nil {
			log.Printf("Successfully connected to database with option #%d", i+1)
			return db
		}
		log.Printf("Connection attempt #%d failed: %v", i+1, err)
	}

	log.Fatal("Failed to connect to database with all options")
	return nil
}

func main() {
	loadEnvMulti()

	log.Println("🔐 GATHER_BRIDGE_SECRET present?:", os.Getenv("GATHER_BRIDGE_SECRET") != "")
	log.Println("🌐 GATHER_CLONE_URL:", os.Getenv("GATHER_CLONE_URL"))

	// โหลดค่า env สำหรับ email
	sendgridKey := os.Getenv("SENDGRID_API_KEY")
	fromEmail := os.Getenv("FROM_EMAIL")
	if sendgridKey == "" {
		log.Println("⚠️  SENDGRID_API_KEY not set")
	}

	r := gin.Default()
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Printf("SetTrustedProxies: %v", err)
	}
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Dummy-User"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// เชื่อมต่อฐานข้อมูล
	db = setupDatabase()
	if db == nil {
		log.Fatal("Failed to connect to database")
	}
	log.Println("✅ Database connected successfully")

	// หลังสร้าง gorm.DB (db) ให้รัน migrate
	if err := db.AutoMigrate(&entity.AIGeneratedImage{}); err != nil {
		// ไม่ panic เพื่อให้เซิร์ฟเวอร์ยังขึ้นได้ — log เตือนให้แก้ schema ด้วยมือ
		log.Printf("❌ Warning: failed to auto-migrate AIGeneratedImage: %v", err)
		// continue without panicking
	} else {
		log.Println("✅ AIGeneratedImage migrated successfully")
	}

	// ⭐ Auto Migrate Event (เพิ่มคอลัมน์ is_active ถ้ายังไม่มี)
	log.Println("🔄 Running auto migration for Event...")
	if err := db.AutoMigrate(&entity.Event{}); err != nil {
		log.Printf("❌ Failed to migrate Event table: %v", err)
	} else {
		log.Println("✅ Event table migrated successfully")
	}

	// <- เพิ่มบรรทัดนี้ เพื่อให้ GORM สร้างตาราง notifications อัตโนมัติ
	if err := db.AutoMigrate(&entity.Notification{}); err != nil {
		log.Printf("❌ Failed to migrate Notification table: %v", err)
	} else {
		log.Println("✅ Notification table migrated successfully")
	}

	// AutoMigrate ตาราง Report
	if err := db.AutoMigrate(&entity.Report{}); err != nil {
		log.Printf("❌ Failed to migrate Report table: %v", err)
	} else {
		log.Println("✅ Report table migrated successfully")
	}

	// ✅ PasswordResetToken
	if err := db.AutoMigrate(&entity.PasswordResetToken{}); err != nil {
		log.Printf("❌ Failed to migrate PasswordResetToken table: %v", err)
	} else {
		log.Println("✅ PasswordResetToken table migrated successfully")
	}

	// สร้าง EmailService (ใช้ = ไม่ใช้ := และใช้ตัวแปร env)
	log.Println("=== Initializing Email Service ===")
	emailService = NewEmailService(db, sendgridKey, fromEmail)
	if emailService == nil {
		log.Fatal("Failed to create Email service")
	}
	log.Println("✅ Email service created successfully")

	// User
	userRepo := persistence.NewMySQLUserRepository(db)
	userUsecase := usecase.NewUserUsecase(userRepo)
	userHandler := httpHandler.NewUserHandler(userUsecase, db)
	userHandler.RegisterRoutes(r)

	// Notification (ต้องมาก่อน EventHandler ที่เรียก .WithNotif)
	notifRepo := persistence.NewMySQLNotificationRepository(db)
	notifUC := usecase.NewNotificationUsecase(notifRepo)
	notifHandler := httpHandler.NewNotificationHandler(notifUC)
	notifHandler.RegisterRoutes(r)

	// Event
	eventRepo := persistence.NewMySQLEventRepository(db)
	eventUsecase := usecase.NewEventUsecase(eventRepo)
	eventHandler := httpHandler.NewEventHandler(eventUsecase).WithDB(db).WithNotif(notifUC)
	eventHandler.RegisterRoutes(r)

	// Organizer (ย้ายตามเดิม)
	organizerRepo := persistence.NewMySQLOrganizerRepository(db)
	organizerUsecase := usecase.NewOrganizerUsecase(organizerRepo)
	organizerHandler := httpHandler.NewOrganizerHandler(organizerUsecase, eventUsecase, userUsecase)
	organizerHandler.RegisterRoutes(r)

	// Report (ส่ง organizerUsecase เข้าไปด้วย)
	reportRepo := persistence.NewMySQLReportRepository(db)
	reportUC := usecase.NewReportUsecase(reportRepo)
	reportHandler := httpHandler.NewReportHandler(reportUC, eventUsecase, db, notifUC)
	reportHandler.RegisterRoutes(r)

	// Matching
	matchingRepo := persistence.NewMySQLMatchingRepository(db)
	matchingUsecase := usecase.NewMatchingUsecase(matchingRepo)
	matchingHandler := httpHandler.NewMatchingHandler(matchingUsecase)
	matchingHandler.RegisterRoutes(r)

	// Comment
	commentRepo := persistence.NewMySQLCommentRepository(db)
	commentUsecase := usecase.NewCommentUsecase(commentRepo)
	commentHandler := httpHandler.NewCommentHandler(commentUsecase)
	commentHandler.RegisterRoutes(r)

	// Favorite
	favoriteRepo := persistence.NewMySQLFavoriteRepository(db)
	favoriteUsecase := usecase.NewFavoriteUsecase(favoriteRepo)
	favoriteHandler := httpHandler.NewFavoriteHandler(favoriteUsecase)
	favoriteHandler.RegisterRoutes(r)

	// RequestOrganizer
	reqRepo := persistence.NewMySQLRequestOrganizerRepository(db)
	reqUsecase := usecase.NewRequestOrganizerUsecase(reqRepo)

	// Image usecase
	reqImgRepo := persistence.NewMySQLRequestOrganizerImageRepository(db)
	reqImgUsecase := usecase.NewRequestOrganizerImageUsecase(reqImgRepo)

	requestOrganizerHandler := httpHandler.NewRequestOrganizerHandler(reqUsecase, reqImgUsecase, db, notifUC, approvalMailer{})
	requestOrganizerHandler.RegisterRoutes(r)

	// LoginHandler
	loginHandler := httpHandler.NewLoginHandler(userUsecase, db)
	loginHandler.RegisterRoutes(r)

	// OrganizerPortfolio
	organizerPortfolioRepo := persistence.NewMySQLOrganizerPortfolioRepository(db)
	organizerPortfolioUsecase := usecase.NewOrganizerPortfolioUsecase(organizerPortfolioRepo)
	organizerPortfolioHandler := httpHandler.NewOrganizerPortfolioHandler(organizerPortfolioUsecase)
	organizerPortfolioHandler.RegisterRoutes(r)

	// ⭐ EventReview - แก้ไข Route Pattern ⭐
	log.Println("=== Initializing EventReview ===")

	eventReviewRepo := persistence.NewMySQLEventReviewRepository(db)
	if eventReviewRepo == nil {
		log.Fatal("Failed to create EventReview repository")
	}
	log.Println("✅ EventReview repository created successfully")

	eventReviewUsecase := usecase.NewEventReviewUsecase(eventReviewRepo)
	if eventReviewUsecase == nil {
		log.Fatal("Failed to create EventReview usecase")
	}
	log.Println("✅ EventReview usecase created successfully")

	eventReviewHandler := httpHandler.NewEventReviewHandler(eventReviewUsecase, db)
	if eventReviewHandler == nil {
		log.Fatal("Failed to create EventReview handler")
	}
	log.Println("✅ EventReview handler created successfully")

	// Register routes แบบใหม่ที่ไม่ conflict
	log.Println("📡 Registering EventReview routes...")
	r.POST("/events/:id/reviews", eventReviewHandler.Create)
	r.GET("/events/:id/reviews", eventReviewHandler.GetByEventID)
	r.GET("/events/:id/reviews/avg", eventReviewHandler.GetAvgRating)
	r.GET("/reviews/user/:user_id", eventReviewHandler.GetUserReviews)
	r.PUT("/events/:id/reviews/:review_id", eventReviewHandler.UpdateReview)
	r.DELETE("/events/:id/reviews/:review_id", eventReviewHandler.DeleteReview)
	// เพิ่ม All reviews สำหรับหน้าแอดมิน
	r.GET("/event_reviews", eventReviewHandler.GetAll)
	r.DELETE("/event_reviews/:review_id", eventReviewHandler.DeleteReview)
	log.Println("✅ EventReview routes registered successfully!")
	log.Println("   - GET /reviews/user/:user_id ✅")

	// OrganizerReview
	organizerReviewRepo := persistence.NewMySQLOrganizerReviewRepository(db)
	organizerReviewUsecase := usecase.NewOrganizerReviewUsecase(organizerReviewRepo)
	organizerReviewHandler := httpHandler.NewOrganizerReviewHandler(organizerReviewUsecase, db)
	// organizerReviewHandler.RegisterRoutes(router) // ไม่มีเมธอดนี้ ใช้ประกาศเส้นทางเองแทน

	// ✅ เพิ่มเส้นทางที่หน้า OrganizerDetail.jsx เรียกใช้อยู่
	r.POST("/organizers/:id/reviews", organizerReviewHandler.Create)
	r.GET("/organizers/:id/reviews", organizerReviewHandler.GetByOrganizerID)
	r.GET("/organizers/:id/reviews/avg", organizerReviewHandler.GetAvgRating)

	// ที่มีอยู่เดิม
	r.GET("/organizer_reviews", organizerReviewHandler.GetAll)
	r.DELETE("/organizer_reviews/:review_id", organizerReviewHandler.DeleteReview)

	// EventImageHandler
	eventImageRepo := persistence.NewMySQLEventImageRepository(db)
	eventImageUsecase := usecase.NewEventImageUsecase(eventImageRepo)
	eventImageHandler := httpHandler.NewEventImageHandler(eventImageUsecase)
	r.POST("/events/:id/images", eventImageHandler.UploadImages)
	r.GET("/events/:id/images", eventImageHandler.GetImages)
	r.DELETE("/event_images/:image_id", eventImageHandler.DeleteImage)

	// OrganizerPortfolioImageHandler
	organizerPortfolioImageRepo := persistence.NewMySQLOrganizerPortfolioImageRepository(db)
	organizerPortfolioImageUsecase := usecase.NewOrganizerPortfolioImageUsecase(organizerPortfolioImageRepo)
	organizerPortfolioImageHandler := httpHandler.NewOrganizerPortfolioImageHandler(organizerPortfolioImageUsecase)
	r.POST("/organizer_portfolios/:id/images", organizerPortfolioImageHandler.UploadImages)
	r.GET("/organizer_portfolios/:id/images", organizerPortfolioImageHandler.GetImages)
	r.DELETE("/organizer_portfolio_images/:image_id", organizerPortfolioImageHandler.DeleteImage)

	// ✅ Categories route
	categoryHandler := httpHandler.NewCategoryHandler(db)
	categoryHandler.RegisterRoutes(r)

	// Static files - use a local uploads directory under backend/cmd/api
	uploadsDir := filepath.Join(".", "uploads")
	if abs, err := filepath.Abs(uploadsDir); err == nil {
		uploadsDir = abs
	}
	// สร้างโฟลเดอร์ถ้ายังไม่มี (safe)
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadsDir, 0755); err != nil {
			log.Fatalf("failed to create uploads dir %s: %v", uploadsDir, err)
		}
	}
	log.Printf("✅ Using canonical uploads dir: %s", uploadsDir)

	// debug listing
	if files, err := os.ReadDir(uploadsDir); err == nil {
		for _, f := range files {
			log.Printf("DEBUG uploads contains: %s", f.Name())
		}
	} else {
		log.Printf("DEBUG read uploads error: %v", err)
	}

	// expose to handlers in internal/interfaces/http
	httpHandler.UploadsDir = uploadsDir

	// ensure common subfolders exist
	subfolders := []string{
		"events",
		"venues",
		"organizer_portfolios",
		"ai_generated",
		"invitations",
		"users",
	}
	for _, sf := range subfolders {
		p := filepath.Join(uploadsDir, sf)
		if err := os.MkdirAll(p, 0755); err != nil {
			log.Fatalf("failed to create uploads subfolder %s: %v", p, err)
		}
		log.Printf("✅ ensured uploads subfolder: %s", p)
	}

	// serve static uploads (use absolute path)
	r.Static("/uploads", uploadsDir)

	// Test route
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server is running!"})
	})

	log.Println("🚀 All routes registered successfully")

	// === Venue Handler - แก้ไข ===
	log.Println("=== Initializing Venue ===")

	venueRepo := persistence.NewMySQLVenueRepository(db)
	if venueRepo == nil {
		log.Fatal("Failed to create Venue repository")
	}
	log.Println("✅ Venue repository created successfully")

	// เพิ่ม VenueImage Repository & Usecase
	venueImageRepo := persistence.NewMySQLVenueImageRepository(db)
	if venueImageRepo == nil {
		log.Fatal("Failed to create VenueImage repository")
	}
	log.Println("✅ VenueImage repository created successfully")

	venueUsecase := usecase.NewVenueUsecase(venueRepo)
	if venueUsecase == nil {
		log.Fatal("Failed to create Venue usecase")
	}
	log.Println("✅ Venue usecase created successfully")

	venueImageUsecase := usecase.NewVenueImageUsecase(venueImageRepo)
	if venueImageUsecase == nil {
		log.Fatal("Failed to create VenueImage usecase")
	}
	log.Println("✅ VenueImage usecase created successfully")

	// สร้าง VenueHandler ด้วย 2 parameters
	venueHandler := httpHandler.NewVenueHandler(venueUsecase, venueImageUsecase)
	if venueHandler == nil {
		log.Fatal("Failed to create Venue handler")
	}
	log.Println("✅ Venue handler created successfully")

	// Register Venue routes
	venueHandler.RegisterRoutes(r)
	log.Println("✅ Venue routes registered successfully!")

	// --- Add VenueReview registration ---
	venueReviewRepo := persistence.NewMySQLVenueReviewRepository(db)
	venueReviewUC := usecase.NewVenueReviewUsecase(venueReviewRepo)
	venueReviewHandler := httpHandler.NewVenueReviewHandler(venueReviewUC, db)
	venueReviewHandler.RegisterRoutes(r)
	log.Println("✅ VenueReview routes registered: POST/GET /venues/:id/reviews")

	// 📧 Email Service Routes - ใช้ EmailService ที่แยกออกมา
	log.Println("📡 Registering Email Service routes...")
	r.POST("/send-invitation-email", emailService.SendInvitationEmail)
	// ✅ Forgot/Reset Password
	r.POST("/auth/forgot-password", emailService.ForgotPassword)
	r.POST("/auth/reset-password", emailService.ResetPassword)
	log.Println("✅ Email service routes registered successfully!")
	log.Println("   - POST /send-invitation-email ✅")
	log.Println("   - POST /auth/forgot-password ✅")
	log.Println("   - POST /auth/reset-password ✅")

	// AI Generated Image Handler - แก้ไขแล้ว
	log.Println("=== Initializing AI Generated Image ===")
	aiImageRepo := persistence.NewMySQLAIGeneratedImageRepository(db)
	if aiImageRepo == nil {
		log.Fatal("Failed to create AI Generated Image repository")
	}
	log.Println("✅ AI Generated Image repository created successfully")

	aiImageUsecase := usecase.NewAIGeneratedImageUsecase(aiImageRepo)
	if aiImageUsecase == nil {
		log.Fatal("Failed to create AI Generated Image usecase")
	}
	log.Println("✅ AI Generated Image usecase created successfully")

	aiImageHandler := httpHandler.NewAIGeneratedImageHandler(aiImageUsecase)
	if aiImageHandler == nil {
		log.Fatal("Failed to create AI Generated Image handler")
	}
	log.Println("✅ AI Generated Image handler created successfully")

	// AI Generated Image Routes
	log.Println("📡 Registering AI Generated Image routes...")
	r.POST("/ai-generated-images/save", aiImageHandler.SaveImages)
	r.GET("/ai-generated-images/user/:user_id/:type", aiImageHandler.GetUserImages)
	r.GET("/ai-generated-images/album/:album_id", aiImageHandler.GetAlbumImages)
	r.DELETE("/ai-generated-images/:id", aiImageHandler.DeleteImage)
	r.DELETE("/ai-generated-images/album/:album_id", aiImageHandler.DeleteAlbum)
	log.Println("✅ AI Generated Image routes registered successfully!")
	log.Println("   - POST /ai-generated-images/save ✅")
	log.Println("   - GET /ai-generated-images/user/:user_id/:type ✅")
	log.Println("   - GET /ai-generated-images/album/:album_id ✅")
	log.Println("   - DELETE /ai-generated-images/:id ✅")
	log.Println("   - DELETE /ai-generated-images/album/:album_id ✅")

	// REMOVED: broken subpackages
	// categoryHandler := categoryhttp.NewCategoryHandler(db)
	// categoryHandler.RegisterRoutes(r)

	// Auth helper (dummy)
	r.GET("/auth/me", MeHandler)
	r.GET("/auth/session", SessionHandler)

	r.GET("/realms/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "demo" {
			c.JSON(200, gin.H{
				"id":         "demo",
				"share_id":   "demo",
				"name":       "Demo Realm",
				"only_owner": false,
				"owner_id":   "system",
				"map_data": gin.H{
					"spawnpoint": gin.H{"roomIndex": 0, "x": 5, "y": 5},
					"rooms": []any{
						gin.H{
							"id": "room0", "name": "Main Room", "width": 20, "height": 20,
							"tiles": []any{}, "colliders": []any{}, "special_tiles": []any{},
							"spawn_area": gin.H{"x": 5, "y": 5, "width": 1, "height": 1},
						},
					},
				},
			})
			return
		}
		c.JSON(404, gin.H{"error": "realm not found"})
	})

	log.Println("🌐 Starting server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
