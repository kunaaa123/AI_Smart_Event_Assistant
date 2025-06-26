package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/infrastructure/persistence"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/interfaces/http"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/usecase"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func setupDatabase() *gorm.DB {
	dsn := "root:root@tcp(127.0.0.1:3306)/AI_Smart_Event_Assistant?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}
	return db
}

func main() {
	router := gin.Default()

	// เพิ่ม CORS middleware
	router.Use(cors.Default())

	db := setupDatabase()

	// User
	userRepo := persistence.NewMySQLUserRepository(db)
	userUsecase := usecase.NewUserUsecase(userRepo)
	userHandler := http.NewUserHandler(userUsecase)
	userHandler.RegisterRoutes(router)

	// Event
	eventRepo := persistence.NewMySQLEventRepository(db)
	eventUsecase := usecase.NewEventUsecase(eventRepo)
	eventHandler := http.NewEventHandler(eventUsecase)
	eventHandler.RegisterRoutes(router)

	// Organizer
	organizerRepo := persistence.NewMySQLOrganizerRepository(db)
	organizerUsecase := usecase.NewOrganizerUsecase(organizerRepo)
	organizerHandler := http.NewOrganizerHandler(organizerUsecase)
	organizerHandler.RegisterRoutes(router)

	// Matching
	matchingRepo := persistence.NewMySQLMatchingRepository(db)
	matchingUsecase := usecase.NewMatchingUsecase(matchingRepo)
	matchingHandler := http.NewMatchingHandler(matchingUsecase)
	matchingHandler.RegisterRoutes(router)

	// Comment
	commentRepo := persistence.NewMySQLCommentRepository(db)
	commentUsecase := usecase.NewCommentUsecase(commentRepo)
	commentHandler := http.NewCommentHandler(commentUsecase)
	commentHandler.RegisterRoutes(router)

	// Favorite
	favoriteRepo := persistence.NewMySQLFavoriteRepository(db)
	favoriteUsecase := usecase.NewFavoriteUsecase(favoriteRepo)
	favoriteHandler := http.NewFavoriteHandler(favoriteUsecase)
	favoriteHandler.RegisterRoutes(router)

	// RequestOrganizer
	requestOrganizerRepo := persistence.NewMySQLRequestOrganizerRepository(db)
	requestOrganizerUsecase := usecase.NewRequestOrganizerUsecase(requestOrganizerRepo)
	requestOrganizerHandler := http.NewRequestOrganizerHandler(requestOrganizerUsecase)
	requestOrganizerHandler.RegisterRoutes(router)

	// เพิ่ม LoginHandler
	loginHandler := http.NewLoginHandler(userUsecase)
	loginHandler.RegisterRoutes(router)

	// OrganizerPortfolio
	organizerPortfolioRepo := persistence.NewMySQLOrganizerPortfolioRepository(db)
	organizerPortfolioUsecase := usecase.NewOrganizerPortfolioUsecase(organizerPortfolioRepo)
	organizerPortfolioHandler := http.NewOrganizerPortfolioHandler(organizerPortfolioUsecase)
	organizerPortfolioHandler.RegisterRoutes(router)

	router.Run(":8080")
}
