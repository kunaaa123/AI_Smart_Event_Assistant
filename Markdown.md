สรุปโจทย์โปรเจกต์ (Gather Town Clone + Event Sharing)
เป้าหมาย:
สร้างโลกเสมือน (Virtual World) แบบ Gather Town ที่

มี “โลกเดียว” (map เดียว) สำหรับทุกคน
ผู้ใช้ล็อกอินด้วยระบบของตัวเอง (Go/MySQL ไม่ใช้ Supabase)
ตัวละครแต่ละคนเดินในโลกเดียวกันแบบ real-time
ผู้ใช้แต่ละคน “แชร์อีเว้นท์” ของตัวเอง (event)
อีเว้นท์ของแต่ละคนจะถูกผูกกับ “โต๊ะ” หรือ “จุด” เฉพาะใน map (fix position)
ผู้ใช้คนอื่นสามารถเดินมาที่โต๊ะ/จุดนั้นเพื่อดูรายละเอียดอีเว้นท์ที่แชร์ไว้
ทุกอย่างต้องเชื่อมกับ backend เดิม (Go/MySQL) ของคุณ
ฟีเจอร์หลักที่ต้องมี

ระบบล็อกอิน/ยืนยันตัวตน (ใช้ backend เดิม)
ระบบโลกเสมือน (map เดียว, ตัวละครเดินได้, เห็นคนอื่นแบบ real-time)
ระบบผูก event กับ user (แต่ละ user มี event ของตัวเอง)
ระบบแสดง event ที่โต๊ะ/จุดใน map (fix position)
ระบบให้คนอื่นเดินมาดู event ของแต่ละ user ได้
ไม่ใช้ Supabase (ตัดออกทั้งหมด)
เทคโนโลยี

Frontend: Next.js/React, Pixi.js (หรือ Phaser.js)
Backend: Node.js (gather-clone backend) + Go/MySQL (ระบบหลักของคุณ)
Real-time: Socket.io

หมายเหตุ

ต้องแก้ gather-clone ให้ใช้ Auth และ API จากระบบคุณเอง
ต้องออกแบบ mapping user → โต๊ะ/จุดใน map
ต้องเชื่อมข้อมูล event/user จาก Go API