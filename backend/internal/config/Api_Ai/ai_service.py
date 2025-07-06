# ai_service.py
from flask import Flask, request, Response
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

# System prompt สำหรับบทบาทและภาษา
system_prompt = (
    "ขอให้คุณทำหน้าที่เป็นผู้เชี่ยวชาญด้านการจัดงานอีเว้นท์มืออาชีพที่มีประสบการณ์มากกว่า 10 ปี "
    "ให้คำแนะนำเกี่ยวกับการจัดงานอีเว้นท์ต่างๆ โดยตอบให้กระชับ ไม่เกิน 5 บรรทัด ถ้าข้อมูลไม่พอให้ถามกลับสั้นๆ "
    "ตอบเป็นภาษาไทยเท่านั้น"
)

@app.route("/ai-chat", methods=["POST"])
def ai_chat():
    data = request.json
    user_message = data.get("message", "")

    def generate():
        res = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "gemma",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            },
            stream=True
        )
        for line in res.iter_lines():
            if line:
                chunk = line.decode("utf-8")
                try:
                    obj = json.loads(chunk)
                    content = obj.get("message", {}).get("content", "")
                    if content:
                        yield content
                except Exception:
                    pass

    return Response(generate(), mimetype="text/plain")

if __name__ == "__main__":
    app.run(port=8081)