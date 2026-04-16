package http

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
)

// SanitizeFilename keeps letters/numbers/dot/dash/underscore, replaces spaces with underscore,
// other runes -> '-'
func SanitizeFilename(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, " ", "_")
	return strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '.' || r == '-' || r == '_' {
			return r
		}
		return '-'
	}, name)
}

// NewUniqueFilename returns a unique filename: <timestamp>_<uuid>_<sanitized-original>
func NewUniqueFilename(orig string) string {
	s := SanitizeFilename(orig)
	uid := uuid.New().String()
	ts := time.Now().UnixNano()
	return fmt.Sprintf("%d_%s_%s", ts, uid, s)
}
