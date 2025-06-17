package main

import (
	"log"

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

	// Setup Database
	db := setupDatabase()

	// Setup Dependencies
	userRepo := persistence.NewMySQLUserRepository(db)
	userUsecase := usecase.NewUserUsecase(userRepo)
	userHandler := http.NewUserHandler(userUsecase)

	// Register Routes
	userHandler.RegisterRoutes(router)

	// Run Server
	router.Run(":8080")
}
