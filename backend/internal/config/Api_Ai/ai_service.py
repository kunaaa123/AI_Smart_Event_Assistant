from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import json
import base64
import time
import logging
from deep_translator import GoogleTranslator
import re
from PIL import Image
import io
from huggingface_hub import InferenceClient

# เพิ่ม imports สำหรับ matching
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import mysql.connector
import os
from typing import List, Dict

app = Flask(__name__)
CORS(app)

# ตั้งค่า logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def enhance_prompt_for_invitations(prompt):
    """ปรับปรุง prompt สำหรับการสร้างบัตรเชิญ — คืน tuple (prompt_for_model_en, enhanced_th, negative_prompt)"""
    try:
        translator = GoogleTranslator(source='th', target='en')
        english_prompt = translator.translate(prompt)
    except Exception as e:
        logger.warning(f"Translate failed, using original prompt: {e}")
        english_prompt = prompt

    visual_keywords = [
        "ultra-detailed", "8k", "highly detailed", "photorealistic",
        "soft warm cinematic lighting", "volumetric light", "rim light",
        "beautiful bokeh", "intricate textures", "ornate decorative elements",
        "soft shadows", "studio quality", "premium print-ready composition",
        "fine paper texture", "subtle grain", "elegant color grading",
        "print-ready 300dpi"
    ]

    layout_keywords = [
        "elegant layout", "beautiful typography", "decorative border",
        "balanced composition", "centered headline", "clear readable text",
        "use elegant Thai fonts and calligraphy, include exact Thai text where needed"
    ]

    invitation_keywords = [
        "invitation card", "premium design", "festive", "celebration",
        "delicate floral elements", "gold foil accents", "minimal luxury",
        "high detail ornate motifs"
    ]

    negative_prompt = (
        "low quality, lowres, deformed, extra limbs, watermark, signature, "
        "blurry, out of focus, oversaturated, underexposed, jpeg artifacts, "
        "text artifacts, distorted typography"
    )

    # สร้าง prompt ภาษาอังกฤษสำหรับโมเดล (ไม่ใส่ Thai text field ลงใน prompt หลัก)
    enhanced_english = ", ".join([english_prompt] + visual_keywords + layout_keywords + invitation_keywords)
    final_prompt_en = f"{enhanced_english}"

    enhanced_th = f"{prompt}, ดีไซน์หรูหรา มีการจัดวางเรียบร้อย ตัวอักษรภาษาไทยสวยงาม, แสงอบอุ่น, รายละเอียดสูง"

    logger.info(f"Enhanced invitation prompt (EN): {final_prompt_en}")
    logger.info(f"Enhanced invitation prompt (TH): {enhanced_th}")
    logger.info(f"Invitation negative prompt: {negative_prompt}")

    return final_prompt_en, enhanced_th, negative_prompt


def enhance_prompt_for_events(prompt):
    """ปรับปรุง prompt สำหรับการสร้างภาพอีเว้นท์ — คืน tuple (prompt_for_model_en, enhanced_th, negative_prompt)"""
    try:
        translator = GoogleTranslator(source='th', target='en')
        english_prompt = translator.translate(prompt)
    except Exception as e:
        logger.warning(f"Translate failed, using original prompt: {e}")
        english_prompt = prompt

    visual_keywords = [
        "ultra-detailed", "high detail", "cinematic lighting", "natural skin tones",
        "dramatic rim light", "wide angle composition", "vivid colors",
        "photorealistic", "8k", "intricate scene details", "depth of field",
        "realistic materials"
    ]

    event_keywords = [
        "event decoration", "professional setup", "beautiful venue", "festive atmosphere",
        "elegant arrangement", "detailed scene", "ambient lighting", "happy guests"
    ]

    negative_prompt = (
        "low quality, watermark, text, logo, cropped, deformed faces, extra limbs, "
        "blurry, lowres, unnatural colors, oversaturated"
    )

    enhanced_english = ", ".join([english_prompt] + visual_keywords + event_keywords)
    final_prompt_en = f"{enhanced_english}"

    enhanced_th = f"{prompt}, บรรยากาศงานสวยงาม แสงเงาโดดเด่น รายละเอียดสูง"

    logger.info(f"Enhanced event prompt (EN): {final_prompt_en}")
    logger.info(f"Enhanced event prompt (TH): {enhanced_th}")
    logger.info(f"Event negative prompt: {negative_prompt}")

    return final_prompt_en, enhanced_th, negative_prompt


# NOTE: Removed duplicate/overriding versions of enhance_prompt_for_invitations
# and enhance_prompt_for_events that returned only a string and caused callers
# expecting a tuple to fail. Keep single implementations above that return
# (final_prompt, enhanced_th).

# ตั้งค่าให้บังคับใช้ HF model เดี่ยวเพื่อประหยัด token / หยุดเช็ค model อื่น
FORCE_HF_MODEL = "black-forest-labs/FLUX.1-schnell"

# ตรวจสอบว่ามี HUGGING_FACE_API_TOKEN หรือไม่
try:
    HUGGING_FACE_API_TOKEN = os.getenv("HUGGING_FACE_API_TOKEN", "")
    if not HUGGING_FACE_API_TOKEN or HUGGING_FACE_API_TOKEN == "hf_your_token_here":
        logger.warning("⚠️ HUGGING_FACE_API_TOKEN not set properly")
    else:
        logger.info("✅ HUGGING_FACE_API_TOKEN loaded successfully")
except:
    logger.error("❌ Failed to load HUGGING_FACE_API_TOKEN")
    HUGGING_FACE_API_TOKEN = None

# เพิ่ม class สำหรับ organizer matching
class OrganizerMatcher:
    def __init__(self):
        try:
            # โหลด sentence transformer model
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Sentence transformer model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load sentence transformer: {e}")
            self.model = None
    
    def get_organizers_from_db(self):
        """ดึงข้อมูล organizers จากฐานข้อมูล"""
        try:
            connection = mysql.connector.connect(
                host='localhost',
                database='AI_Smart_Event_Assistant',
                user='root',
                password='root',
                port=3306,
                charset='utf8mb4',
                autocommit=True
            )
            
            cursor = connection.cursor(dictionary=True)
            
            # ตรวจสอบว่าตาราง organizers มีอยู่หรือไม่
            cursor.execute("SHOW TABLES LIKE 'organizers'")
            table_exists = cursor.fetchone()
            
            if not table_exists:
                logger.warning("⚠️ Table 'organizers' not found")
                return []
            
            # แก้ไข query ให้ดึงทั้ง profile_image และ portfolio_img
            query = """
            SELECT 
                o.organizer_id,
                o.user_id,
                o.expertise,
                o.portfolio_img,
                u.first_name,
                u.last_name,
                u.profile_image,
                u.bio
            FROM organizers o
            JOIN users u ON o.user_id = u.user_id
            WHERE u.role IN ('organizer', 'admin')
            LIMIT 10
            """
            
            cursor.execute(query)
            organizers = cursor.fetchall()
            
            cursor.close()
            connection.close()
            
            logger.info(f"📊 Loaded {len(organizers)} organizers from database")
            return organizers
        
        except mysql.connector.Error as e:
            logger.error(f"❌ MySQL error: {e}")
            logger.error(f"Error code: {e.errno}")
            return []
        except Exception as e:
            logger.error(f"❌ Database error: {e}")
            return []
    
    def calculate_similarity(self, user_prompt, organizers, threshold=0.3):
        """คำนวณความคล้ายคลึงระหว่าง prompt และ organizer"""
        if not self.model:
            logger.warning("⚠️ No sentence transformer model available")
            return []
        
        try:
            # สร้าง embedding สำหรับ user prompt
            user_embedding = self.model.encode([user_prompt])
            
            matches = []
            
            for organizer in organizers:
                # รวมข้อมูล organizer เป็นข้อความ
                organizer_text = f"{organizer.get('expertise', '')} {organizer.get('bio', '')}"
                
                if not organizer_text.strip():
                    continue
                
                # สร้าง embedding สำหรับ organizer
                organizer_embedding = self.model.encode([organizer_text])
                
                # คำนวณ cosine similarity
                similarity = cosine_similarity(user_embedding, organizer_embedding)[0][0]
                
                # ถ้า similarity มากกว่า threshold
                if similarity >= threshold:
                    organizer['similarity_score'] = float(similarity)
                    organizer['match_percentage'] = int(similarity * 100)
                    matches.append(organizer)
            
            # เรียงตาม similarity จากมากไปน้อย
            matches.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            # จำกัดผลลัพธ์ไม่เกิน 5 คน
            return matches[:5]
            
        except Exception as e:
            logger.error(f"❌ Similarity calculation error: {e}")
            return []

# สร้าง instance ของ matcher
matcher = OrganizerMatcher()

# System prompt ใหม่ที่โหดและเฉพาะเจาะจง
system_prompt = """
You are "EventMaster AI", a master-level event planning assistant with over 15 years of experience.

Primary responsibilities:
- Provide specialist advice for all types of events (weddings, birthdays, parties, seminars, concerts, corporate events, trade shows, product launches, etc.)
- Analyze budget, timeline, venue, decoration, catering, entertainment
- Recommend vendors, suppliers and service providers by area
- Troubleshoot on-site event issues
- Provide marketing and promotion strategies for events

Hard rule:
❌ If the question is NOT related to events, reply: "Sorry, I am EventMaster AI and only provide event planning and management advice. Please ask about event planning or event management."

Response style:
- Use relevant emojis
- Concise, actionable answers (2-4 lines)
- Provide practical, usable recommendations
- Suggest approximate pricing and budget context (for Thailand)
- Demonstrate expertise with useful details

Reply in English only.
"""

# เพิ่มฟังก์ชันตรวจสอบว่าเป็นคำถามเกี่ยวกับอีเว้นท์หรือไม่
def is_event_related_question(message):
    """ตรวจสอบว่าคำถามเกี่ยวข้องกับอีเว้นท์หรือไม่"""
    
    # คำสำคัญที่เกี่ยวข้องกับอีเว้นท์
    event_keywords = [
        # งานอีเว้นท์ทั่วไป
        'งาน', 'อีเว้นท์', 'event', 'จัดงาน', 'งานเลี้ยง', 'ปาร์ตี้', 'party',
        
        # ประเภทงาน
        'แต่งงาน', 'wedding', 'วันเกิด', 'birthday', 'ครบรอบ', 'anniversary',
        'สัมมนา', 'seminar', 'workshop', 'conference', 'ประชุม', 'meeting',
        'คอนเสิร์ต', 'concert', 'show', 'performance', 'แสดง',
        'งานบวช', 'งานศพ', 'งานขึ้นบ้านใหม่', 'housewarming',
        'graduation', 'จบการศึกษา', 'รับปริญญา',
        'เปิดร้าน', 'grand opening', 'launch', 'เปิดตัวสินค้า',
        'ของขวัญ', 'gift', 'present',
        
        # การวางแผนงาน
        'วางแผน', 'plan', 'planning', 'จัดการ', 'management', 'organize',
        'timeline', 'ไทม์ไลน์', 'กำหนดการ', 'schedule', 'ตารางเวลา',
        'checklist', 'รายการ', 'เช็คลิสต์',
        
        # งบประมาณ
        'งบประมาณ', 'budget', 'ราคา', 'price', 'cost', 'ค่าใช้จ่าย',
        'เงิน', 'money', 'บาท', 'baht', 'ถูก', 'แพง', 'expensive', 'cheap',
        
        # สถานที่
        'สถานที่', 'venue', 'location', 'ห้องจัดงาน', 'banquet', 'hall',
        'โรงแรม', 'hotel', 'resort', 'รีสอร์ท', 'ร้านอาหาร', 'restaurant',
        'สวน', 'garden', 'outdoor', 'indoor', 'beach', 'ชายหาด',
        
        # การตกแต่ง
        'ตกแต่ง', 'decoration', 'decor', 'จัดดอกไม้', 'flower', 'ดอกไม้',
        'บอลลูน', 'balloon', 'lighting', 'แสงไฟ', 'เวที', 'stage',
        'backdrop', 'พื้นหลัง', 'theme', 'ธีม', 'สี', 'color',
        
        # อาหารและเครื่องดื่ม
        'อาหาร', 'food', 'catering', 'เค้ก', 'cake', 'dessert', 'ของหวาน',
        'เครื่องดื่ม', 'drink', 'beverage', 'cocktail', 'บุฟเฟ่ต์', 'buffet',
        'มื้อ', 'meal', 'menu', 'เมนู', 'จานหลัก', 'main course',
        
        # การถ่ายภาพ
        'ช่างภาพ', 'photographer', 'photo', 'รูปภาพ', 'วีดีโอ', 'video',
        'ถ่ายภาพ', 'shooting', 'edit', 'แต่งรูป',
        
        # เสียงและแสง
         'เสียง', 'sound', 'ไมค์', 'microphone', 'speaker', 'music', 'เพลง',
        'dj', 'ดีเจ', 'band', 'วงดนตรี', 'นักร้อง', 'singer',
        
        # การเชิญ
        'เชิญ', 'invite', 'invitation', 'บัตรเชิญ', 'แขก', 'guest',
        'รายชื่อ', 'list', 'RSVP', 'ตอบรับ',
        
        # ขนส่งและที่พัก
        'รถ', 'car', 'transport', 'ขนส่ง', 'shuttle', 'รถบัส', 'bus',
        'ที่พัก', 'accommodation', 'hotel booking', 'จองโรงแรม',
        
        # ของที่ระลึก
        'ของที่ระลึก', 'souvenir', 'gift', 'goodie bag', 'ถุงของขวัญ',
        
        # การโปรโมท
        'โปรโมท', 'promote', 'marketing', 'การตลาด', 'โฆษณา', 'ads',
        'social media', 'facebook', 'instagram', 'line',
        
        # ผู้ให้บริการ
        'vendor', 'supplier', 'ผู้ให้บริการ', 'บริษัท', 'ร้าน', 'shop',
        'ช่าง', 'technician', 'staff', 'พนักงาน', 'ทีมงาน', 'crew',
        
        # อื่นๆ
        'กิจกรรม', 'activity', 'เกม', 'game', 'ของรางวัล', 'prize',
        'lucky draw', 'จับฉลาก', 'mc', 'พิธีกร', 'host',
        'protocol', 'พิธีการ', 'ceremony', 'ritual'
    ]
    
    message_lower = message.lower()
    
    # ตรวจสอบคำสำคัญ
    for keyword in event_keywords:
        if keyword.lower() in message_lower:
            return True
    
    # ตรวจสอบรูปแบบประโยคที่เกี่ยวข้องกับอีเว้นท์
    event_patterns = [
        'จัด.*งาน', 'ทำ.*งาน', 'จะมี.*งาน', 'อยาก.*งาน',
        'ช่วย.*งาน', 'แนะนำ.*งาน', 'วางแผน.*งาน',
        'how.*event', 'plan.*event', 'organize.*event'
    ]
    
    import re
    for pattern in event_patterns:
        if re.search(pattern, message_lower):
            return True
    
    return False

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "service": "AI Service",
        "endpoints": ["/ai-chat", "/ai-generate-image", "/ai-match-organizers", "/test-hf-token"]
    })

@app.route("/ai-chat", methods=["POST"])
def ai_chat():
    try:
        data = request.json
        user_message = data.get("message", "")
        
        if not user_message:
            return jsonify({"error": "Please provide a message"}), 400
        
        # ตรวจสอบว่าเป็นคำถามเกี่ยวกับอีเว้นท์หรือไม่
        if not is_event_related_question(user_message):
            # ตอบแบบเท่และเฉพาะเจาะจง
            non_event_response = """Sorry — I am EventMaster AI 🎪 and only provide advice for event planning and management.

I can help with:
🎯 Event planning for all types
💰 Budget management
🏛️ Venue and vendor selection
🎨 Decoration and theming
📱 Promotion and marketing

Please ask about event planning or event management! 🚀"""
            
            def generate_fixed_response():
                yield non_event_response
            
            return Response(generate_fixed_response(), mimetype="text/plain")
        
        # ถ้าเป็นคำถามเกี่ยวกับอีเว้นท์ ให้ดำเนินการปกติ
        def generate():
            try:
                res = requests.post(
                    "http://localhost:11434/api/chat",
                    json={
                        "model": "gemma",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ]
                    },
                    stream=True,
                    timeout=30
                )
                
                if res.status_code != 200:
                    yield f"Error: {res.status_code} - {res.text}"
                    return
                
                for line in res.iter_lines():
                    if line:
                        chunk = line.decode("utf-8")
                        try:
                            obj = json.loads(chunk)
                            content = obj.get("message", {}).get("content", "")
                            if content:
                                yield content
                        except Exception as e:
                            logger.error(f"JSON parse error: {e}")
                            continue
                            
            except requests.exceptions.RequestException as e:
                yield f"Connection Error: {str(e)}"
            except Exception as e:
                yield f"Server Error: {str(e)}"
        
        return Response(generate(), mimetype="text/plain")
        
    except Exception as e:
        logger.error(f"AI Chat Error: {str(e)}")
        return jsonify({"error": "เกิดข้อผิดพลาดในระบบ"}), 500

@app.route("/test-hf-token", methods=["GET"])
def test_hf_token():
    """ทดสอบ Hugging Face Token"""
    try:
        headers = {
            "Authorization": f"Bearer {HUGGING_FACE_API_TOKEN}",
        }
        
        # ทดสอบด้วย API endpoint สำหรับดูข้อมูล user
        response = requests.get(
            "https://huggingface.co/api/whoami",
            headers=headers,
            timeout=10
        )
        
        logger.info(f"Token test status: {response.status_code}")
        logger.info(f"Token test response: {response.text}")
        
        if response.status_code == 200:
            user_info = response.json()
            return jsonify({
                "status": "success",
                "message": "Token is valid",
                "user": user_info.get("name", "Unknown"),
                "token_valid": True
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Token is invalid",
                "status_code": response.status_code,
                "token_valid": False
            }), 400
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"เกิดข้อผิดพลาด: {str(e)}",
            "token_valid": False
        }), 500

def get_working_models():
    """ตรวจสอบ models ที่ทำงานได้"""
    headers = {
        "Authorization": f"Bearer {HUGGING_FACE_API_TOKEN}",
    }
    
    working_models = []
    
    test_models = [
        # runwayml แนะนำให้ลองก่อนเพื่อลดการใช้โควต้า/ค่าใช้จ่าย
        "runwayml/stable-diffusion-v1-5",
        "CompVis/stable-diffusion-v1-4",
        "stabilityai/stable-diffusion-2-1",
        "Artples/LAI-ImageGeneration-vSDXL-2",
        "XLabs-AI/flux-RealismLora",
        "stabilityai/sdxl-turbo",
        "black-forest-labs/FLUX.1-schnell",
        # Qwen ถ้าต้องการเก็บไว้ให้ตรวจ แต่จะไม่ถูกเรียกเป็นค่าเริ่มต้น
        "Qwen/Qwen-Image"
    ]
    
    for model in test_models:
        try:
            response = requests.get(
                f"https://huggingface.co/api/models/{model}",
                headers=headers,
                timeout=5
            )
            if response.status_code == 200:
                working_models.append(model)
                logger.info(f"✅ Model working: {model}")
            else:
                logger.warning(f"❌ Model not available: {model} (Status: {response.status_code})")
        except Exception as e:
            logger.error(f"❌ Error checking model {model}: {str(e)}")
    
    return working_models

def generate_image_with_retry(prompt, max_retries=2, width=1024, height=1024, guidance_scale=7.5, seed=None, force_model=FORCE_HF_MODEL):
    """Create image — supports prompt as string or tuple from enhance_* (prompt_en, enhanced_th, negative)
    - Default now forces FORCE_HF_MODEL to avoid trying many models (saves token/quota).
    - Reduced default max_retries to 2 to save calls and token.
    - Keep num_inference_steps lower by default in parameters to cut cost.
    """
    headers = {"Authorization": f"Bearer {HUGGING_FACE_API_TOKEN}"} if HUGGING_FACE_API_TOKEN else {}

    # รองรับทั้ง string และ tuple ที่มี negative prompt
    enhanced_prompt = prompt
    enhanced_prompt_th = ""
    negative_prompt = ""
    if isinstance(prompt, (tuple, list)):
        if len(prompt) >= 1:
            enhanced_prompt = prompt[0]
        if len(prompt) >= 2:
            enhanced_prompt_th = prompt[1]
        if len(prompt) >= 3:
            negative_prompt = prompt[2]

    # ถ้า input เป็น string ให้พยายามเพิ่มคำอธิบาย (เหตุการณ์หรือบัตรเชิญ)
    if not isinstance(prompt, (tuple, list)) and isinstance(prompt, str):
        try:
            # ใช้ event enhancer by default (this keeps previous behavior)
            enhanced_result = enhance_prompt_for_events(prompt)
            enhanced_prompt = enhanced_result[0]
            enhanced_prompt_th = enhanced_result[1]
            negative_prompt = enhanced_result[2]
        except Exception:
            enhanced_prompt = prompt
            enhanced_prompt_th = ""

    # ถ้า seed ไม่ถูกส่งมา ให้สุ่มหนึ่งค่าเพื่อความหลากหลาย
    if seed is None:
        seed = int(time.time() * 1000) % 2**31

    # สร้าง payload parameters ที่รองรับ negative_prompt และ seed
    parameters = {
        "width": width,
        "height": height,
        "guidance_scale": guidance_scale,
        # ลด num_inference_steps ลงเพื่อประหยัดโทเคน/เวลา (ปรับได้ตามคุณภาพที่ต้องการ)
        "num_inference_steps": 20,
        "negative_prompt": negative_prompt,
        "seed": seed
    }

    # ถ้า force_model ถูกกำหนด ให้ใช้แค่ model เดียว (ไม่ตรวจสอบรายชื่อ models อื่น)
    other_models = []
    if force_model:
        other_models = [force_model]
        logger.info(f"🔒 Forcing single model: {force_model}")
    else:
        # ตรวจสอบ models ที่ใช้ได้ (fallback เก่า)
        try:
            working_models = get_working_models()
        except Exception:
            working_models = []

        preferred_order = [
            "runwayml/stable-diffusion-v1-5",
            "black-forest-labs/FLUX.1-schnell",
            "stabilityai/sdxl-turbo",
            "stabilityai/stable-diffusion-2-1",
            "CompVis/stable-diffusion-v1-4"
        ]
        other_models = [m for m in preferred_order if m in working_models] + [m for m in working_models if m not in preferred_order]

    for model in other_models:
        logger.info(f"🔄 Trying model: {model} (seed={seed})")
        for attempt in range(max_retries):
            try:
                payload = {
                    "inputs": enhanced_prompt,
                    "parameters": parameters,
                    "options": {"wait_for_model": True}
                }
                resp = requests.post(f"https://api-inference.huggingface.co/models/{model}",
                                     headers={**headers, "Content-Type": "application/json"},
                                     json=payload,
                                     timeout=120)
                logger.info(f"Attempt {attempt+1} on {model} status: {resp.status_code}")
                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    if "image" in content_type or len(resp.content) > 1000:
                        logger.info(f"✅ Success with model: {model}")
                        return {
                            "success": True,
                            "content": resp.content,
                            "model": model,
                            "prompt_used": enhanced_prompt,
                            "original_prompt": prompt,
                            "enhanced_prompt_th": enhanced_prompt_th
                        }
                    else:
                        try:
                            j = resp.json()
                            # common HF inference returned base64 images
                            if isinstance(j, dict):
                                if "images" in j and j["images"]:
                                    img0 = j["images"][0]
                                    if isinstance(img0, str):
                                        img_bytes = base64.b64decode(img0)
                                        return {"success": True, "content": img_bytes, "model": model, "prompt_used": enhanced_prompt, "original_prompt": prompt}
                                if "image" in j and isinstance(j["image"], str):
                                    img_bytes = base64.b64decode(j["image"])
                                    return {"success": True, "content": img_bytes, "model": model, "prompt_used": enhanced_prompt, "original_prompt": prompt}
                        except Exception:
                            pass
                        logger.warning(f"Invalid response from {model}")
                elif resp.status_code in (503, 429):
                    logger.info(f"Model {model} loading or rate-limited ({resp.status_code}), retrying...")
                    time.sleep(5 + attempt * 3)
                    continue
                else:
                    logger.warning(f"Model {model} returned {resp.status_code}: {resp.text}")
                    break
            except requests.exceptions.Timeout:
                logger.warning(f"⏱️ Timeout on {model} attempt {attempt+1}")
                time.sleep(3)
                continue
            except Exception as e:
                logger.error(f"❌ Exception on {model}: {e}")
                time.sleep(2)
                continue

    return {"success": False, "error": "Unable to generate image from any AI models. Please try again."}

@app.route("/ai-generate-image", methods=["POST"])
def ai_generate_image():
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        data = request.json
        prompt = data.get("prompt", "").strip()
        
        if not prompt:
            return jsonify({"error": "Please provide an image description (prompt)"}), 400
        
        if len(prompt) > 500:
            return jsonify({"error": "Prompt too long (max 500 characters)"}), 400
        
        logger.info(f"Generating image with prompt: {prompt}")
        
        result = generate_image_with_retry(prompt)
        
        if result["success"]:
            img_bytes = result["content"]
            img_base64 = base64.b64encode(img_bytes).decode("utf-8")
            
            return jsonify({
                "success": True,
                "image_base64": img_base64,
                "model_used": result["model"],
                "prompt": prompt,
                "enhanced_prompt": result.get("prompt_used", "")
            })
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 400
            
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "เกิดข้อผิดพลาดในระบบ"
        }), 500

def process_reference_image(image_base64):
    """ประมวลผลรูปอ้างอิงเพื่อใช้ในการอธิบาย"""
    try:
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        width, height = image.size
        
        description = "event decoration inspired by reference image, "
        
        if width > height:
            description += "wide venue setup, "
        elif height > width:
            description += "tall decoration elements, "
        else:
            description += "balanced composition, "
            
        return description
        
    except Exception as e:
        logger.error(f"Error processing reference image: {e}")
        return "event decoration, "

@app.route("/ai-generate-image-with-reference", methods=["POST"])
def ai_generate_image_with_reference():
    """สร้างรูปภาพโดยใช้รูปอ้างอิง"""
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        data = request.json
        prompt = data.get("prompt", "").strip()
        reference_image = data.get("reference_image", "")
        
        if not prompt:
            return jsonify({"error": "Please provide an image description (prompt)"}), 400
        
        reference_description = ""
        if reference_image:
            reference_description = process_reference_image(reference_image)
        
        combined_prompt = f"{reference_description}{prompt}"
        
        logger.info(f"Generating image with reference - Combined prompt: {combined_prompt}")
        
        result = generate_image_with_retry(combined_prompt)
        
        if result["success"]:
            img_bytes = result["content"]
            img_base64 = base64.b64encode(img_bytes).decode("utf-8")
            
            return jsonify({
                "success": True,
                "image_base64": img_base64,
                "model_used": result["model"],
                "prompt": prompt,
                "enhanced_prompt": result.get("prompt_used", ""),
                "has_reference": bool(reference_image)
            })
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }, 400)
            
    except Exception as e:
        logger.error(f"Image generation with reference error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "เกิดข้อผิดพลาดในระบบ"
        }), 500

@app.route("/ai-generate-invitation", methods=["POST"])
def ai_generate_invitation():
    """สร้างบัตรเชิญด้วย AI"""
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400

        data = request.json
        prompt = data.get("prompt", "").strip()
        if not prompt:
            return jsonify({"error": "Please provide an invitation description"}), 400

        enhanced_prompt, enhanced_th, negative_prompt = enhance_prompt_for_invitations(prompt)
        logger.info(f"Generating invitation with prompt (model): {enhanced_prompt}")

        # ส่งเป็น tuple เพื่อให้ generate_image_with_retry ใช้ค่า negative_prompt และไม่ re-enhance
        result = generate_image_with_retry((enhanced_prompt, enhanced_th, negative_prompt))

        if result["success"]:
            img_bytes = result["content"]
            img_base64 = base64.b64encode(img_bytes).decode("utf-8")

            return jsonify({
                "success": True,
                "image_base64": img_base64,
                "model_used": result["model"],
                "prompt": prompt,
                "enhanced_prompt": enhanced_prompt,
                "enhanced_prompt_th": enhanced_th
            })
        else:
            return jsonify({"success": False, "error": result["error"]}), 400

    except Exception as e:
        logger.error(f"Invitation generation error: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

# เพิ่ม endpoint สำหรับสร้างบัตรเชิญแบบละเอียด
@app.route("/ai-generate-invitation-detailed", methods=["POST"])
def ai_generate_invitation_detailed():
    """สร้างบัตรเชิญด้วยข้อมูลละเอียดจาก Wizard"""
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        data = request.json
        prompt = data.get("prompt", "").strip()
        event_type = data.get("event_type", "")
        theme = data.get("theme", "")
        colors = data.get("colors", [])
        style = data.get("style", "")
        
        if not prompt:
            return jsonify({"error": "Please provide an invitation description"}), 400
        
        enhanced_parts = [prompt]
        
        if event_type:
            enhanced_parts.append(f"for {event_type} event")
        
        if theme:
            enhanced_parts.append(f"{theme} theme")
            
        if style:
            enhanced_parts.append(f"{style} style")
            
        if colors:
            enhanced_parts.append(f"color scheme: {', '.join(colors)}")
        
        combined_prompt = ", ".join(enhanced_parts)
        logger.info(f"Generating detailed invitation with prompt: {combined_prompt}")
        
        # คืนค่าเป็น tuple (english_prompt, enhanced_th, negative_prompt)
        final_prompt = enhance_prompt_for_invitations(combined_prompt)
        result = generate_image_with_retry(final_prompt)
        
        if result["success"]:
            img_bytes = result["content"]
            img_base64 = base64.b64encode(img_bytes).decode("utf-8")
            
            return jsonify({
                "success": True,
                "image_base64": img_base64,
                "model_used": result["model"],
                "original_prompt": prompt,
                "enhanced_prompt": final_prompt[0],
                "enhanced_prompt_th": final_prompt[1],
                "wizard_data": {
                    "event_type": event_type,
                    "theme": theme,
                    "colors": colors,
                    "style": style
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 400
            
    except Exception as e:
        logger.error(f"Detailed invitation generation error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

# เพิ่ม endpoint สำหรับ matching
@app.route("/ai-match-organizers", methods=["POST"])
def ai_match_organizers():
    """หาผู้จัดอีเว้นต์ที่เหมาะสมตาม prompt"""
    try:
        data = request.json
        # รองรับทั้ง prompt และ user_prompt
        prompt = data.get("prompt", "") or data.get("user_prompt", "")
        prompt = prompt.strip()
        
        if not prompt:
            return jsonify({"error": "Please provide a description"}), 400
        
        logger.info(f"Matching request for prompt: {prompt}")
        
        # ดึงข้อมูล organizers
        organizers = matcher.get_organizers_from_db()
        
        if not organizers:
            return jsonify({
                "success": True,
                "matches": [],
                "message": "No organizers found in the system"
            })
        
        # คำนวณ matching
        matches = matcher.calculate_similarity(prompt, organizers)
        
        # ปรับโครงสร้างข้อมูลให้ตรงกับ frontend
        formatted_matches = []
        for match in matches:
            formatted_match = {
                "organizer_id": match.get("organizer_id"),
                "name": f"{match.get('first_name', '')} {match.get('last_name', '')}".strip(),
                "first_name": match.get("first_name"),
                "last_name": match.get("last_name"),
                "expertise": match.get("expertise"),
                "profile_image": match.get("profile_image"),
                "bio": match.get("bio"),
                "similarity_score": match.get("similarity_score"),
                "match_percentage": match.get("match_percentage")
            }
            formatted_matches.append(formatted_match)
        
        logger.info(f"Found {len(formatted_matches)} matches")
        
        return jsonify({
            "success": True,
            "matches": formatted_matches,
            "total_organizers": len(organizers)
        })
        
    except Exception as e:
        logger.error(f"Matching error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Internal matching error"
        }), 500

@app.route("/test-db-connection", methods=["GET"])
def test_db_connection():
    """ทดสอบการเชื่อมต่อฐานข้อมูล"""
    try:
        organizers = matcher.get_organizers_from_db()
        return jsonify({
            "success": True,
            "organizer_count": len(organizers),
            "organizers": organizers[:2] if organizers else [],  # แสดงแค่ 2 คนแรก
            "has_sentence_transformer": matcher.model is not None
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/ai-generate-invitation-album", methods=["POST"])
def ai_generate_invitation_album():
    """สร้างบัตรเชิญ 3 แบบพร้อมกัน (Album)"""
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400

        data = request.json
        prompt = data.get("prompt", "").strip()
        count = int(data.get("count", 3))  # จำนวนภาพที่ต้องการ

        if not prompt:
            return jsonify({"error": "กรุณาใส่คำอธิบายบัตรเชิญ"}), 400

        if len(prompt) > 500:
            return jsonify({"error": "คำอธิบายยาวเกินไป (สูงสุด 500 ตัวอักษร)"}), 400

        logger.info(f"Generating invitation album with prompt: {prompt}, count: {count}")

        images = []
        # handle both possible return types of enhance_prompt_for_invitations
        enhanced_result = enhance_prompt_for_invitations(prompt)
        if isinstance(enhanced_result, (tuple, list)) and len(enhanced_result) >= 2:
            enhanced_prompt, enhanced_th, negative_prompt = enhanced_result[0], enhanced_result[1], enhanced_result[2] if len(enhanced_result) > 2 else ""
        else:
            enhanced_prompt = enhanced_result
            enhanced_th = prompt
            negative_prompt = ""

        last_result = None
        for i in range(count):
            # เพิ่มความหลากหลายในการสร้างแต่ละภาพ
            variation_prompt = f"{enhanced_prompt}, variation {i+1}, different composition"
            # ส่งเป็น tuple เพื่อให้ใช้ negative_prompt และไม่ไปเรียก enhancer อีกครั้ง
            result = generate_image_with_retry((variation_prompt, enhanced_th, negative_prompt))
            last_result = result

            if result and result.get("success"):
                img_bytes = result["content"]
                img_base64 = base64.b64encode(img_bytes).decode("utf-8")
                images.append(img_base64)
                logger.info(f"Generated image {i+1}/{count}")
            else:
                logger.warning(f"Failed to generate image {i+1}: {result.get('error', 'Unknown error') if result else 'No result'}")

        # เมื่อส่งกลับ ให้รวม enhanced_prompt_th ด้วย
        if len(images) > 0:
            return jsonify({
                "success": True,
                "images": images,
                "count": len(images),
                "model_used": (last_result.get("model") if last_result else "unknown"),
                "prompt": prompt,
                "enhanced_prompt": enhanced_prompt,
                "enhanced_prompt_th": enhanced_th
            })
        else:
            return jsonify({
                "success": False,
                "error": "ไม่สามารถสร้างรูปภาพใดๆ ได้"
            }), 400

    except Exception as e:
        logger.error(f"Album generation error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "เกิดข้อผิดพลาดในระบบ"
        }), 500

if __name__ == "__main__":
    logger.info("Starting AI Service with Matching...")
    logger.info(f"Available endpoints: /ai-chat, /ai-generate-image, /ai-match-organizers, /test-hf-token")
    
    # ติดตั้ง dependencies ที่จำเป็น
    try:
        import sentence_transformers
        import sklearn
        import mysql.connector
        logger.info("All matching dependencies available")
    except ImportError as e:
        logger.warning(f"Missing dependency: {e}")
        logger.warning("Install with: pip install sentence-transformers scikit-learn mysql-connector-python")
    
    app.run(host="0.0.0.0", port=8081, debug=True)