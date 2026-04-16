package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/kunaaa123/smart-ai-event-assistant/backend/pkg/migrate"
)

func main() {
	task := flag.String("task", "events", "migration task: events|venues|all")
	dsn := flag.String("dsn", "root:@tcp(127.0.0.1:3306)/AI_Smart_Event_Assistant?charset=utf8mb4&parseTime=True&loc=Local", "DB DSN")
	uploads := flag.String("uploads", `..\api\uploads`, "uploads dir")
	flag.Parse()

	// ensure uploads dir exists
	if _, err := os.Stat(*uploads); os.IsNotExist(err) {
		if err := os.MkdirAll(*uploads, 0755); err != nil {
			log.Fatalf("cannot create uploads dir: %v", err)
		}
	}

	switch *task {
	case "events":
		if err := migrate.MigrateEventImages(*dsn, *uploads); err != nil {
			log.Fatalf("events migration failed: %v", err)
		}
	case "venues":
		if err := migrate.MigrateVenueImages(*dsn, *uploads); err != nil {
			log.Fatalf("venues migration failed: %v", err)
		}
	case "all":
		if err := migrate.MigrateEventImages(*dsn, *uploads); err != nil {
			log.Fatalf("events migration failed: %v", err)
		}
		if err := migrate.MigrateVenueImages(*dsn, *uploads); err != nil {
			log.Fatalf("venues migration failed: %v", err)
		}
	default:
		fmt.Println("unknown task:", *task)
	}
}
