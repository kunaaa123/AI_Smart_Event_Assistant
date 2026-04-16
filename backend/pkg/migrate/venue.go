package migrate

import (
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
)

func MigrateVenueImages(dsn, uploadsDir string) error {
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("db open: %w", err)
	}
	defer db.Close()

	venuesDir := filepath.Join(uploadsDir, "venues")
	if err := os.MkdirAll(venuesDir, 0755); err != nil {
		return fmt.Errorf("mkdir venues: %w", err)
	}

	rows, err := db.Query("SELECT image_id, image_url FROM venue_images")
	if err != nil {
		return fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	type rec struct {
		id  int
		url string
	}
	var recs []rec
	for rows.Next() {
		var r rec
		if err := rows.Scan(&r.id, &r.url); err != nil {
			return fmt.Errorf("scan: %w", err)
		}
		recs = append(recs, r)
	}

	for _, r := range recs {
		old := strings.TrimPrefix(r.url, "/")
		old = strings.TrimPrefix(old, "./")
		old = strings.TrimPrefix(old, "uploads/")
		oldPath := filepath.Join(uploadsDir, old)
		if _, err := os.Stat(oldPath); os.IsNotExist(err) {
			fmt.Printf("skip (not found): image_id=%d url=%s\n", r.id, r.url)
			continue
		}
		u := uuid.New().String()
		ts := time.Now().UnixNano()
		orig := filepath.Base(oldPath)
		newName := fmt.Sprintf("%d_%s_%s", ts, u, orig)
		newPath := filepath.Join(venuesDir, newName)

		if err := os.Rename(oldPath, newPath); err != nil {
			in, err := os.Open(oldPath)
			if err != nil {
				fmt.Printf("move failed open: %v\n", err)
				continue
			}
			out, err := os.Create(newPath)
			if err != nil {
				in.Close()
				fmt.Printf("move failed create: %v\n", err)
				continue
			}
			if _, err := io.Copy(out, in); err != nil {
				in.Close()
				out.Close()
				fmt.Printf("move failed copy: %v\n", err)
				continue
			}
			in.Close()
			out.Close()
			_ = os.Remove(oldPath)
		}

		newURL := "/uploads/venues/" + newName
		if _, err := db.Exec("UPDATE venue_images SET image_url = ? WHERE image_id = ?", newURL, r.id); err != nil {
			fmt.Printf("DB update failed for id=%d err=%v\n", r.id, err)
			continue
		}
		fmt.Printf("moved id=%d -> %s\n", r.id, newURL)
	}

	fmt.Println("done")
	return nil
}
