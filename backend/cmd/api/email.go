package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kunaaa123/smart-ai-event-assistant/backend/internal/domain/entity"
	gomail "gopkg.in/gomail.v2"
	"gorm.io/gorm"
)

// EmailService struct สำหรับจัดการการส่งอีเมล
type EmailService struct {
	db        *gorm.DB
	apiKey    string
	fromEmail string
	// +++ SMTP config
	smtpHost  string
	smtpPort  int
	smtpUser  string
	smtpPass  string
	transport string // "sendgrid" (default) | "smtp"
}

// NewEmailService สร้าง EmailService ใหม่
func NewEmailService(db *gorm.DB, apiKey, fromEmail string) *EmailService {
	transport := strings.ToLower(os.Getenv("EMAIL_TRANSPORT"))
	if transport == "" {
		transport = "smtp" // ค่าเริ่มต้นใช้ SMTP
	}
	port := 587
	if v := os.Getenv("SMTP_PORT"); v != "" {
		if p, err := strconv.Atoi(v); err == nil {
			port = p
		}
	}
	return &EmailService{
		db:        db,
		apiKey:    apiKey,
		fromEmail: fromEmail,
		smtpHost:  os.Getenv("SMTP_HOST"),
		smtpPort:  port,
		smtpUser:  os.Getenv("SMTP_USER"),
		smtpPass:  os.Getenv("SMTP_PASS"),
		transport: transport,
	}
}

// SendInvitationEmailRequest โครงสร้างข้อมูลที่รับจาก frontend
type SendInvitationEmailRequest struct {
	To        string `form:"to" binding:"required"`
	CC        string `form:"cc"`
	BCC       string `form:"bcc"`
	Subject   string `form:"subject" binding:"required"`
	Message   string `form:"message"`
	UserID    string `form:"user_id"`
	Prompt    string `form:"prompt"`
	CreatedAt string `form:"createdAt"`
}

// SendInvitationEmail Handler สำหรับส่งบัตรเชิญทางอีเมล
func (es *EmailService) SendInvitationEmail(c *gin.Context) {
	log.Println("📧 Starting email sending process...")

	// Bind form data
	var req SendInvitationEmailRequest
	if err := c.ShouldBind(&req); err != nil {
		log.Printf("❌ Failed to bind request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	log.Printf("📋 Request data: To=%s, Subject=%s, UserID=%s", req.To, req.Subject, req.UserID)

	// ตรวจข้อมูลซ้ำ TO/CC/BCC
	emailMap := map[string]bool{req.To: true}
	if req.CC != "" && req.CC == req.To {
		req.CC = ""
	}
	if req.CC != "" {
		if emailMap[req.CC] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมล CC ซ้ำกับ TO"})
			return
		}
		emailMap[req.CC] = true
	}
	if req.BCC != "" && req.BCC == req.To {
		req.BCC = ""
	}
	if req.BCC != "" {
		if emailMap[req.BCC] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมล BCC ซ้ำกับ TO หรือ CC"})
			return
		}
	}

	// ดึงผู้ส่ง/Reply-To
	fromName, replyToEmail := es.getUserInfo(req.UserID)

	// ไฟล์แนบบัตรเชิญ
	fileBytes, err := es.getAttachmentFile(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค่าเริ่มต้น
	es.setDefaultValues(&req)

	// HTML สำหรับคำเชิญ (สวย เป็นระเบียบ)
	htmlContent := es.generateFormalInvitationHTML(req, fileBytes)

	// โหมดส่งอีเมล (TO/CC/BCC)
	mode := es.determineEmailMode(req.CC, req.BCC)

	// ส่ง SMTP (HTML + plain alternative + แนบไฟล์)
	if err := es.sendEmail(req, fromName, replyToEmail, htmlContent, fileBytes); err != nil {
		log.Printf("❌ Email sending failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "ไม่สามารถส่งอีเมลได้",
			"details": err.Error(),
		})
		return
	}

	log.Printf("✅ Email sent successfully (%s mode) to: %s", mode, req.To)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("ส่งบัตรเชิญสำเร็จ (%s)", mode),
		"to":      req.To,
		"mode":    mode,
	})
}

// getUserInfo ปรับปรุงชื่อผู้ส่งให้ดูเป็นมืออาชีพ
func (es *EmailService) getUserInfo(userID string) (string, string) {
	fromName := "Smart Event Assistant Team"
	replyToEmail := es.fromEmail

	if userID != "" {
		var user entity.User
		if err := es.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
			log.Printf("⚠️ ไม่พบผู้ใช้ ID: %s, ใช้ข้อมูลเริ่มต้น", userID)
		} else {
			// ปรับปรุงรูปแบบชื่อผู้ส่ง
			fromName = fmt.Sprintf("%s %s (Smart Event Assistant)", user.FirstName, user.LastName)
			replyToEmail = user.Email
			log.Printf("✅ พบผู้ใช้: %s (%s)", fromName, user.Email)
		}
	}

	return fromName, replyToEmail
}

// getAttachmentFile ดึงไฟล์แนบจาก request
func (es *EmailService) getAttachmentFile(c *gin.Context) ([]byte, error) {
	fileHeader, err := c.FormFile("invitation")
	if err != nil {
		return nil, fmt.Errorf("ไม่พบไฟล์บัตรเชิญ")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("ไม่สามารถเปิดไฟล์ได้")
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("ไม่สามารถอ่านไฟล์ได้")
	}

	return fileBytes, nil
}

// setDefaultValues ปรับปรุง subject ให้ไม่เป็น spam
func (es *EmailService) setDefaultValues(req *SendInvitationEmailRequest) {
	if req.Prompt == "" {
		req.Prompt = "บัตรเชิญที่สร้างด้วย AI"
	}
	if req.CreatedAt == "" {
		req.CreatedAt = time.Now().Format("2 January 2006 เวลา 15:04 น.")
	}

	// ปรับปรุง Subject ให้ดูธรรมชาติและไม่เป็น spam
	if req.Subject == "" || req.Subject == "บัตรเชิญงานพิเศษ" {
		promptLower := strings.ToLower(req.Prompt)
		if strings.Contains(promptLower, "วันเกิด") || strings.Contains(promptLower, "birthday") {
			req.Subject = "คำเชิญร่วมงานวันเกิด - มาฉลองด้วยกันนะคะ"
		} else if strings.Contains(promptLower, "แต่งงาน") || strings.Contains(promptLower, "wedding") {
			req.Subject = "คำเชิญร่วมงานแต่งงาน - ขอเชิญร่วมเป็นสักขีพยาน"
		} else if strings.Contains(promptLower, "ปาร์ตี้") || strings.Contains(promptLower, "party") {
			req.Subject = "คำเชิญงานปาร์ตี้ - มาสนุกด้วยกันนะคะ"
		} else if strings.Contains(promptLower, "จบการศึกษา") || strings.Contains(promptLower, "graduation") {
			req.Subject = "คำเชิญงานรับปริญญา - ขอเชิญร่วมฉลอง"
		} else {
			req.Subject = "คำเชิญงานพิเศษ - ขอเชิญร่วมงาน"
		}
	}

	if req.Message == "" {
		// ข้อความที่ดูเป็นธรรมชาติมากขึ้น
		promptLower := strings.ToLower(req.Prompt)
		if strings.Contains(promptLower, "วันเกิด") || strings.Contains(promptLower, "birthday") {
			req.Message = "สวัสดีค่ะ ขอเชิญมาร่วมฉลองวันเกิดในโอกาสพิเศษนี้ จะมีความสุขมากๆ ถ้าได้พบกันค่ะ"
		} else if strings.Contains(promptLower, "แต่งงาน") || strings.Contains(promptLower, "wedding") {
			req.Message = "สวัสดีค่ะ ขอเชิญมาร่วมเป็นสักขีพยานในวันสำคัญของเรา จะดีใจมากถ้าได้มีท่านร่วมอวยพร"
		} else if strings.Contains(promptLower, "ปาร์ตี้") || strings.Contains(promptLower, "party") {
			req.Message = "สวัสดีค่ะ ขอเชิญมาร่วมงานปาร์ตี้สุดพิเศษ จะสนุกมากแน่นอน รอพบกันนะคะ"
		} else if strings.Contains(promptLower, "จบการศึกษา") || strings.Contains(promptLower, "graduation") {
			req.Message = "สวัสดีค่ะ ขอเชิญมาร่วมฉลองความสำเร็จในการจบการศึกษา ขอบคุณที่เป็นส่วนหนึ่งในการเดินทางนี้"
		} else {
			req.Message = "สวัสดีค่ะ ขอเชิญท่านมาร่วมงานในโอกาสพิเศษนี้ จะดีใจมากถ้าได้พบกันค่ะ"
		}
	}
}

// determineEmailMode กำหนด mode การส่งอีเมล
func (es *EmailService) determineEmailMode(cc, bcc string) string {
	if cc != "" {
		return "CC"
	} else if bcc != "" {
		return "BCC"
	}
	return "TO"
}

// generateHTMLContent สร้าง HTML content ที่ดูเป็นอีเมลส่วนตัว
func (es *EmailService) generateHTMLContent(req SendInvitationEmailRequest, fileBytes []byte) string {
	imgBase64 := base64.StdEncoding.EncodeToString(fileBytes)

	// กำหนดไอคอนและสีตาม prompt
	eventIcon := "🎉"
	eventType := "งานพิเศษ"
	gradientColor := "#667eea, #764ba2"

	promptLower := strings.ToLower(req.Prompt)
	if strings.Contains(promptLower, "วันเกิด") || strings.Contains(promptLower, "birthday") {
		eventIcon = "🎂"
		eventType = "งานวันเกิด"
		gradientColor = "#ff6b6b, #ffa500"
	} else if strings.Contains(promptLower, "แต่งงาน") || strings.Contains(promptLower, "wedding") {
		eventIcon = "💒"
		eventType = "งานแต่งงาน"
		gradientColor = "#f093fb, #f5576c"
	} else if strings.Contains(promptLower, "ปาร์ตี้") || strings.Contains(promptLower, "party") {
		eventIcon = "🥳"
		eventType = "งานปาร์ตี้"
		gradientColor = "#4facfe, #00f2fe"
	} else if strings.Contains(promptLower, "จบการศึกษา") || strings.Contains(promptLower, "graduation") {
		eventIcon = "🎓"
		eventType = "งานรับปริญญา"
		gradientColor = "#a8edea, #fed6e3"
	} else if strings.Contains(promptLower, "ขึ้นบ้านใหม่") || strings.Contains(promptLower, "housewarming") {
		eventIcon = "🏠"
		eventType = "งานขึ้นบ้านใหม่"
		gradientColor = "#ffecd2, #fcb69f"
	}

	eventDetails := es.extractEventDetails(req.Prompt)
	createdTime := req.CreatedAt
	if createdTime == "เมื่อสักครู่" || createdTime == "" {
		createdTime = time.Now().Format("2 January 2006 เวลา 15:04 น.")
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s คำเชิญ</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, %s);
            padding: 30px 25px;
            text-align: center;
            color: white;
        }
        
        .logo {
            font-size: 40px;
            margin-bottom: 12px;
        }
        
        .email-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .email-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .email-body {
            padding: 30px 25px;
        }
        
        .greeting {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: left;
        }
        
        .message-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid %s;
        }
        
        .message-text {
            font-size: 16px;
            color: #495057;
            line-height: 1.7;
            margin: 0;
        }
        
        .invitation-section {
            text-align: center;
            margin: 25px 0;
        }
        
        .invitation-label {
            display: inline-block;
            background: %s;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .invitation-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            display: inline-block;
            max-width: 100%%;
        }
        
        .invitation-image {
            max-width: 100%%;
            height: auto;
            border-radius: 6px;
        }
        
        .event-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        
        .detail-value {
            color: #6c757d;
        }
        
        .closing {
            text-align: center;
            margin: 25px 0;
            font-size: 16px;
            color: #495057;
        }
        
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px 25px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer-text {
            font-size: 12px;
            color: #6c757d;
            margin: 0;
        }
        
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            
            .email-header {
                padding: 25px 20px;
            }
            
            .email-body {
                padding: 25px 20px;
            }
            
            .email-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">%s</div>
            <h1 class="email-title">%s</h1>
            <p class="email-subtitle">คำเชิญพิเศษ</p>
        </div>
        
        <div class="email-body">
            <div class="greeting">
                สวัสดีค่ะ/ครับ
            </div>
            
            <div class="message-section">
                <p class="message-text">%s</p>
            </div>
            
            <div class="invitation-section">
                <div class="invitation-label">🎫 บัตรเชิญ</div>
                <div class="invitation-card">
                    <img src="data:image/png;base64,%s" alt="%s บัตรเชิญ" class="invitation-image">
                </div>
            </div>
            
            <div class="event-details">
                <div class="detail-item">
                    <span class="detail-label">🎨 ประเภทงาน</span>
                    <span class="detail-value">%s</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 วันที่สร้าง</span>
                    <span class="detail-value">%s</span>
                </div>
                %s
            </div>
            
            <div class="closing">
                หวังว่าจะได้พบกันในงานนะคะ/ครับ 😊
            </div>
        </div>
        
        <div class="email-footer">
            <p class="footer-text">
                อีเมลนี้ส่งมาจากเพื่อนของคุณ
            </p>
        </div>
    </div>
</body>
</html>
`,
		eventType,     // 1. Title
		gradientColor, // 2. Header gradient
		gradientColor, // 3. Message border
		gradientColor, // 4. Invitation label
		eventIcon,     // 5. Logo
		eventType,     // 6. Email title
		req.Message,   // 7. Message
		imgBase64,     // 8. Image
		eventType,     // 9. Image alt
		eventType,     // 10. Event type
		createdTime,   // 11. Created time
		eventDetails,  // 12. Details
	)
}

// extractEventDetails สกัดรายละเอียดจาก prompt
func (es *EmailService) extractEventDetails(prompt string) string {
	if prompt == "" || prompt == "บัตรเชิญที่สร้างด้วย AI" {
		return `<div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">📝 รายละเอียดเพิ่มเติม</div>
                    <div class="info-value">บัตรเชิญที่สร้างขึ้นอย่างพิเศษเพื่อโอกาสสำคัญของคุณ</div>
                </div>`
	}

	// ตัดคำและสร้างข้อมูลที่มีประโยชน์
	words := strings.Fields(prompt)
	var themes, colors, styles []string

	for _, word := range words {
		wordLower := strings.ToLower(word)

		// หาธีม/สไตล์
		if strings.Contains(wordLower, "หรูหรา") || strings.Contains(wordLower, "luxury") || strings.Contains(wordLower, "elegant") {
			themes = append(themes, "หรูหรา")
		}
		if strings.Contains(wordLower, "น่ารัก") || strings.Contains(wordLower, "cute") || strings.Contains(wordLower, "kawaii") {
			themes = append(themes, "น่ารัก")
		}
		if strings.Contains(wordLower, "โมเดิร์น") || strings.Contains(wordLower, "modern") {
			themes = append(themes, "โมเดิร์น")
		}
		if strings.Contains(wordLower, "วินเทจ") || strings.Contains(wordLower, "vintage") || strings.Contains(wordLower, "retro") {
			themes = append(themes, "วินเทจ")
		}
		if strings.Contains(wordLower, "มินิมอล") || strings.Contains(wordLower, "minimal") || strings.Contains(wordLower, "simple") {
			themes = append(themes, "มินิมอล")
		}
		if strings.Contains(wordLower, "คลาสสิค") || strings.Contains(wordLower, "classic") {
			themes = append(themes, "คลาสสิค")
		}

		// หาสี
		if strings.Contains(wordLower, "ทอง") || strings.Contains(wordLower, "gold") {
			colors = append(colors, "ทอง")
		}
		if strings.Contains(wordLower, "ชมพู") || strings.Contains(wordLower, "pink") || strings.Contains(wordLower, "rose") {
			colors = append(colors, "ชมพู")
		}
		if strings.Contains(wordLower, "ขาว") || strings.Contains(wordLower, "white") {
			colors = append(colors, "ขาว")
		}
		if strings.Contains(wordLower, "ฟ้า") || strings.Contains(wordLower, "blue") {
			colors = append(colors, "ฟ้า")
		}
		if strings.Contains(wordLower, "เขียว") || strings.Contains(wordLower, "green") {
			colors = append(colors, "เขียว")
		}
		if strings.Contains(wordLower, "แดง") || strings.Contains(wordLower, "red") {
			colors = append(colors, "แดง")
		}
		if strings.Contains(wordLower, "ม่วง") || strings.Contains(wordLower, "purple") {
			colors = append(colors, "ม่วง")
		}
		if strings.Contains(wordLower, "เงิน") || strings.Contains(wordLower, "silver") {
			colors = append(colors, "เงิน")
		}
		if strings.Contains(wordLower, "ดำ") || strings.Contains(wordLower, "black") {
			colors = append(colors, "ดำ")
		}

		// หาสไตล์พิเศษ
		if strings.Contains(wordLower, "การ์ตูน") || strings.Contains(wordLower, "cartoon") || strings.Contains(wordLower, "anime") {
			styles = append(styles, "การ์ตูน")
		}
		if strings.Contains(wordLower, "3d") || strings.Contains(wordLower, "สามมิติ") {
			styles = append(styles, "3D")
		}
		if strings.Contains(wordLower, "watercolor") || strings.Contains(wordLower, "สีน้ำ") {
			styles = append(styles, "สีน้ำ")
		}
		if strings.Contains(wordLower, "มือวาด") || (strings.Contains(wordLower, "hand") && strings.Contains(wordLower, "draw")) {
			styles = append(styles, "มือวาด")
		}
	}

	// ลบค่าซ้ำ
	themes = removeDuplicates(themes)
	colors = removeDuplicates(colors)
	styles = removeDuplicates(styles)

	// สร้างข้อมูลเพิ่มเติม
	var details strings.Builder

	if len(themes) > 0 {
		details.WriteString(fmt.Sprintf(`<div class="info-item">
                    <div class="info-label">🎭 สไตล์</div>
                    <div class="info-value">%s</div>
                </div>`, strings.Join(themes, ", ")))
	}

	if len(colors) > 0 {
		details.WriteString(fmt.Sprintf(`<div class="info-item">
                    <div class="info-label">🌈 โทนสี</div>
                    <div class="info-value">%s</div>
                </div>`, strings.Join(colors, ", ")))
	}

	if len(styles) > 0 {
		details.WriteString(fmt.Sprintf(`<div class="info-item">
                    <div class="info-label">🎨 เทคนิค</div>
                    <div class="info-value">%s</div>
                </div>`, strings.Join(styles, ", ")))
	}

	// เพิ่มข้อมูล prompt แบบสั้น
	shortPrompt := prompt
	if len(prompt) > 60 {
		shortPrompt = prompt[:60] + "..."
	}

	details.WriteString(fmt.Sprintf(`<div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">💭 คำอธิบายการออกแบบ</div>
                    <div class="info-value">%s</div>
                </div>`, shortPrompt))

	// ถ้าไม่มีข้อมูลใดๆ ให้แสดงข้อความเริ่มต้น
	if details.Len() == 0 {
		return `<div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">📝 คำอธิบาย</div>
                    <div class="info-value">บัตรเชิญที่ออกแบบเป็นพิเศษด้วยเทคโนโลยี AI</div>
                </div>`
	}

	return details.String()
}

// removeDuplicates ลบค่าซ้ำใน slice
func removeDuplicates(slice []string) []string {
	keys := make(map[string]bool)
	var result []string

	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}

	return result
}

// sendEmail ส่งอีเมลผ่าน SMTP (HTML + plain) และแนบไฟล์บัตรเชิญ
func (es *EmailService) sendEmail(req SendInvitationEmailRequest, fromName, replyToEmail, htmlContent string, fileBytes []byte) error {
	realFromName := fromName
	if strings.Contains(fromName, "Smart Event Assistant") {
		parts := strings.Split(fromName, " (")
		if len(parts) > 0 {
			realFromName = strings.TrimSpace(parts[0])
		}
		if realFromName == "" || realFromName == "Smart Event Assistant Team" {
			realFromName = "เพื่อน"
		}
	}

	m := gomail.NewMessage()
	m.SetHeader("From", m.FormatAddress(es.fromEmail, realFromName))
	m.SetHeader("To", req.To)
	if req.CC != "" {
		m.SetHeader("Cc", req.CC)
	}
	if req.BCC != "" {
		m.SetHeader("Bcc", req.BCC)
	}
	m.SetHeader("Subject", req.Subject)
	if replyToEmail != "" {
		m.SetHeader("Reply-To", replyToEmail)
	}

	plain := es.generatePersonalPlainTextContent(req, realFromName)
	if strings.TrimSpace(htmlContent) != "" {
		// เปลี่ยนลำดับ: plain ก่อน แล้วค่อย html
		m.SetBody("text/plain", plain)
		m.AddAlternative("text/html", htmlContent)
	} else {
		m.SetBody("text/plain", plain)
	}

	// แนบไฟล์ invitation.png
	if len(fileBytes) > 0 {
		m.Attach("invitation.png",
			gomail.SetHeader(map[string][]string{"Content-Type": {"image/png"}}),
			gomail.SetCopyFunc(func(w io.Writer) error {
				_, err := w.Write(fileBytes)
				return err
			}),
		)
	}

	d := gomail.NewDialer(es.smtpHost, es.smtpPort, es.smtpUser, es.smtpPass)
	if err := d.DialAndSend(m); err != nil {
		return err
	}
	return nil
}

// sendSimpleEmail ส่ง SMTP แบบ HTML + plain (ใช้กับอีเมลระบบทั่วไป)
func (es *EmailService) sendSimpleEmail(toEmail, subject, htmlContent string) error {
	plain := stripHTML(htmlContent)

	m := gomail.NewMessage()
	m.SetHeader("From", m.FormatAddress(es.fromEmail, "Smart Event Assistant"))
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", subject)

	if strings.TrimSpace(htmlContent) != "" {
		// เปลี่ยนลำดับ: plain ก่อน แล้วค่อย html
		m.SetBody("text/plain", plain)
		m.AddAlternative("text/html", htmlContent)
	} else {
		m.SetBody("text/plain", plain)
	}

	d := gomail.NewDialer(es.smtpHost, es.smtpPort, es.smtpUser, es.smtpPass)
	return d.DialAndSend(m)
}

// ตัวช่วยลอกแท็ก HTML ออก
func stripHTML(s string) string {
	inTag := false
	var b strings.Builder
	for _, r := range s {
		switch r {
		case '<':
			inTag = true
		case '>':
			inTag = false
		default:
			if !inTag {
				b.WriteRune(r)
			}
		}
	}
	return strings.TrimSpace(b.String())
}

func randomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// POST /auth/forgot-password
// body: { "email": "user@example.com" }
func (es *EmailService) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมลไม่ถูกต้อง"})
		return
	}

	// หา user
	var user entity.User
	if err := es.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "ถ้ามีบัญชีนี้ ระบบได้ส่งอีเมลสำหรับเปลี่ยนรหัสผ่านแล้ว"})
		return
	}

	token, err := randomToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโทเค็นได้"})
		return
	}
	reset := entity.PasswordResetToken{
		UserID:    user.UserID,
		Token:     token,
		ExpiresAt: time.Now().Add(60 * time.Minute),
		Used:      false,
	}
	if err := es.db.Create(&reset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกโทเค็นล้มเหลว"})
		return
	}

	frontend := os.Getenv("FRONTEND_BASE_URL")
	if frontend == "" {
		frontend = "http://localhost:5173"
	}
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", frontend, token)

	// Dev mode แสดงลิงก์แทน
	if os.Getenv("EMAIL_DEV_MODE") == "true" {
		log.Printf("🧪 DEV MODE reset URL: %s", resetURL)
		c.JSON(http.StatusOK, gin.H{"message": "ลิงก์รีเซ็ตถูกสร้างแล้ว (dev mode)", "reset_url": resetURL})
		return
	}

	html := es.generateResetPasswordHTML(user.FirstName, user.LastName, resetURL)
	if err := es.sendSimpleEmail(user.Email, "รีเซ็ตรหัสผ่าน - Smart Event Assistant", html); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ส่งอีเมลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ถ้ามีบัญชีนี้ ระบบได้ส่งอีเมลสำหรับเปลี่ยนรหัสผ่านแล้ว"})
}

// POST /auth/reset-password
// body: { "token": "...", "new_password": "..." }
func (es *EmailService) ResetPassword(c *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var prt entity.PasswordResetToken
	if err := es.db.Where("token = ?", req.Token).First(&prt).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "โทเค็นไม่ถูกต้อง"})
		return
	}
	if prt.Used || time.Now().After(prt.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "โทเค็นหมดอายุหรือถูกใช้ไปแล้ว"})
		return
	}

	// อัปเดตรหัสผ่าน (หมายเหตุ: ควรทำการ hash รหัสผ่านในภายหลัง)
	if err := es.db.Model(&entity.User{}).
		Where("user_id = ?", prt.UserID).
		Update("password", req.NewPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตรหัสผ่านล้มเหลว"})
		return
	}

	// ทำเครื่องหมายว่าใช้แล้ว
	if err := es.db.Model(&entity.PasswordResetToken{}).
		Where("id = ?", prt.ID).
		Update("used", true).Error; err != nil {
		// ไม่ fail การเปลี่ยนรหัสผ่าน
	}

	c.JSON(http.StatusOK, gin.H{"message": "เปลี่ยนรหัสผ่านสำเร็จ"})
}

// generateMarketingHTML เทมเพลตสไตล์การตลาด (ปิดใช้งานชั่วคราว: คืนค่าว่าง)
func (es *EmailService) generateMarketingHTML(req SendInvitationEmailRequest, fileBytes []byte) string {
	// ส่งเป็นข้อความธรรมดาเท่านั้นในตอนนี้
	return ""
}

// generateFormalInvitationHTML: อีเมลคำเชิญแบบเป็นทางการ (table + inline CSS)
func (es *EmailService) generateFormalInvitationHTML(req SendInvitationEmailRequest, fileBytes []byte) string {
	img := base64.StdEncoding.EncodeToString(fileBytes)

	eventType := "งานพิเศษ"
	pl := strings.ToLower(req.Prompt)
	switch {
	case strings.Contains(pl, "วันเกิด") || strings.Contains(pl, "birthday"):
		eventType = "งานวันเกิด"
	case strings.Contains(pl, "แต่งงาน") || strings.Contains(pl, "wedding"):
		eventType = "งานแต่งงาน"
	case strings.Contains(pl, "ปาร์ตี้") || strings.Contains(pl, "party"):
		eventType = "งานปาร์ตี้"
	case strings.Contains(pl, "จบการศึกษา") || strings.Contains(pl, "graduation"):
		eventType = "งานรับปริญญา"
	case strings.Contains(pl, "ขึ้นบ้านใหม่") || strings.Contains(pl, "housewarming"):
		eventType = "งานขึ้นบ้านใหม่"
	}

	created := req.CreatedAt
	if strings.TrimSpace(created) == "" || created == "เมื่อสักครู่" {
		created = time.Now().Format("2 January 2006 เวลา 15:04 น.")
	}

	return fmt.Sprintf(`<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f3f5f9;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%%;background:#ffffff;border:1px solid #e6ebf2;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#0b5ed7;color:#ffffff;padding:20px 24px;font-family:Segoe UI,Arial,sans-serif;">
            <div style="font-size:18px;font-weight:600;">Smart Event Assistant</div>
            <div style="font-size:13px;opacity:.9;">ระบบส่งคำเชิญอัตโนมัติ</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px 0 24px;font-family:Segoe UI,Arial,sans-serif;">
            <div style="font-size:20px;color:#0f172a;font-weight:700;line-height:1.4;">%s</div>
            <div style="font-size:14px;color:#64748b;">คำเชิญเข้าร่วม %s</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 8px 24px;font-family:Segoe UI,Arial,sans-serif;">
            <div style="font-size:15px;color:#334155;line-height:1.8;">%s</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 0 24px;">
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f7;border-radius:10px;overflow:hidden;background:#fff;">
              <tr><td style="padding:0;">
                <img src="data:image/png;base64,%s" alt="Invitation" style="display:block;width:100%%;height:auto;">
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 8px 24px;">
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="font-family:Segoe UI,Arial,sans-serif;border:1px solid #eef2f7;border-radius:10px;background:#f8fafc;">
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#475569;width:40%%;">ประเภทงาน</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;width:60%%;text-align:right;">%s</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#475569;border-top:1px solid #eef2f7;">วันที่สร้าง</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;text-align:right;border-top:1px solid #eef2f7;">%s</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 20px 24px;text-align:center;">
            <a href="#" style="display:inline-block;background:#0b5ed7;color:#ffffff;text-decoration:none;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:700;padding:10px 22px;border-radius:6px;">ดูรายละเอียดคำเชิญ</a>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;color:#64748b;padding:14px 24px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;border-top:1px solid #eef2f7;">
            อีเมลฉบับนี้ถูกจัดส่งโดยระบบอัตโนมัติ โปรดอย่าตอบกลับ
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`, req.Subject, eventType, req.Message, img, eventType, created,
	)
}

// generateResetPasswordHTML: อีเมลรีเซ็ตรหัสผ่านแบบเป็นทางการ
func (es *EmailService) generateResetPasswordHTML(first, last, resetURL string) string {
	return fmt.Sprintf(`<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f3f5f9;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%%;background:#ffffff;border:1px solid #e6ebf2;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0b5ed7;color:#fff;padding:18px 24px;font-family:Segoe UI,Arial,sans-serif;font-size:18px;font-weight:600;">Smart Event Assistant</td></tr>
        <tr><td style="padding:20px 24px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;">รีเซ็ตรหัสผ่าน</div>
          <div style="font-size:14px;color:#475569;line-height:1.8;">สวัสดี %s %s,<br>กรุณากดปุ่มด้านล่างเพื่อเปลี่ยนรหัสผ่านของคุณ ลิงก์นี้จะหมดอายุใน 60 นาที</div>
        </td></tr>
        <tr><td align="center" style="padding:8px 24px 20px 24px;">
          <a href="%s" style="display:inline-block;background:#0b5ed7;color:#ffffff;text-decoration:none;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:700;padding:10px 22px;border-radius:6px;">เปลี่ยนรหัสผ่าน</a>
          <div style="font-family:Segoe UI,Arial,sans-serif;color:#64748b;font-size:12px;margin-top:10px;word-break:break-all;">หรือคัดลอกลิงก์นี้: %s</div>
        </td></tr>
        <tr><td style="background:#f8fafc;color:#64748b;padding:14px 24px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;border-top:1px solid #eef2f7;">
            อีเมลฉบับนี้ถูกจัดส่งโดยระบบอัตโนมัติ โปรดอย่าตอบกลับ
          </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`, strings.TrimSpace(first), strings.TrimSpace(last), resetURL, resetURL)
}

// generateWelcomeHTML: อีเมลต้อนรับหลังสมัครสมาชิก
func (es *EmailService) generateWelcomeHTML(first, last string) string {
	name := strings.TrimSpace(strings.TrimSpace(first) + " " + strings.TrimSpace(last))
	if name == "" {
		name = "ผู้ใช้งาน"
	}
	return fmt.Sprintf(`<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f3f5f9;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%%;background:#ffffff;border:1px solid #e6ebf2;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0b5ed7;color:#fff;padding:18px 24px;font-family:Segoe UI,Arial,sans-serif;font-size:18px;font-weight:600;">Smart Event Assistant</td></tr>
        <tr><td style="padding:20px 24px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;">ยินดีต้อนรับสู่ Smart Event Assistant</div>
          <div style="font-size:14px;color:#475569;line-height:1.8;">สวัสดีคุณ %s,<br>ขอบคุณที่สมัครใช้งาน แพลตฟอร์มของเราช่วยให้คุณสร้างและจัดการอีเว้นท์ได้ง่ายขึ้น</div>
        </td></tr>
        <tr><td style="padding:0 24px 20px 24px;">
          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f7;border-radius:10px;background:#f8fafc;">
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#475569;width:60%%;">เริ่มต้นใช้งาน</td>
              <td style="padding:12px 16px;font-size:14px;color:#0f172a;text-align:right;">สร้างบัตรเชิญ, จัดงาน, แชร์ให้เพื่อน</td>
            </tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:8px 24px 20px 24px;">
          <a href="http://localhost:5173" style="display:inline-block;background:#0b5ed7;color:#ffffff;text-decoration:none;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:700;padding:10px 22px;border-radius:6px;">ไปหน้าเริ่มต้น</a>
        </td></tr>
        <tr><td style="background:#f8fafc;color:#64748b;padding:14px 24px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;border-top:1px solid #eef2f7;">
            อีเมลฉบับนี้ถูกส่งจากระบบอัตโนมัติ
          </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`, name)
}

// ส่งอีเมลต้อนรับแบบสะดวกเรียก
func (es *EmailService) SendWelcomeEmail(to, first, last string) error {
	html := es.generateWelcomeHTML(first, last)
	return es.sendSimpleEmail(to, "ยินดีต้อนรับ - Smart Event Assistant", html)
}

// สร้างข้อความล้วนสำหรับอีเมลคำเชิญ (fallback/alternative)
func (es *EmailService) generatePersonalPlainTextContent(req SendInvitationEmailRequest, senderName string) string {
	// ประเภทงานจาก prompt
	eventType := "งานพิเศษ"
	pl := strings.ToLower(req.Prompt)
	switch {
	case strings.Contains(pl, "วันเกิด") || strings.Contains(pl, "birthday"):
		eventType = "งานวันเกิด"
	case strings.Contains(pl, "แต่งงาน") || strings.Contains(pl, "wedding"):
		eventType = "งานแต่งงาน"
	case strings.Contains(pl, "ปาร์ตี้") || strings.Contains(pl, "party"):
		eventType = "งานปาร์ตี้"
	case strings.Contains(pl, "จบการศึกษา") || strings.Contains(pl, "graduation"):
		eventType = "งานรับปริญญา"
	case strings.Contains(pl, "ขึ้นบ้านใหม่") || strings.Contains(pl, "housewarming"):
		eventType = "งานขึ้นบ้านใหม่"
	}

	created := req.CreatedAt
	if strings.TrimSpace(created) == "" || created == "เมื่อสักครู่" {
		created = time.Now().Format("2/1/2006 15:04:05")
	}

	var b strings.Builder
	b.WriteString("สวัสดีค่ะ/ครับ\n\n")
	if strings.TrimSpace(req.Message) != "" {
		b.WriteString(req.Message)
	} else {
		b.WriteString("ขอเชิญมาร่วมงานในโอกาสพิเศษนี้")
	}
	b.WriteString("\n\nได้แนบบัตรเชิญมาให้ดูด้วยนะคะ/ครับ\n\n")
	b.WriteString("รายละเอียด:\n")
	b.WriteString("- ประเภทงาน: " + eventType + "\n")
	b.WriteString("- วันที่สร้าง: " + created + "\n\n")
	b.WriteString("หวังว่าจะได้พบกันในงานนะคะ/ครับ\n\n")
	if strings.TrimSpace(senderName) == "" {
		senderName = "เพื่อน"
	}
	b.WriteString("ขอบคุณค่ะ/ครับ\n")
	b.WriteString(senderName + "\n")
	return b.String()
}
