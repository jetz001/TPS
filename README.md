# ⚡ Local AI Benchmark — TPS & Tool Intelligence Suite

แอปพลิเคชัน Desktop บน Windows/macOS/Linux พัฒนาด้วย **Electron + React 18 + TypeScript + Vite + Tailwind CSS + Recharts** สำหรับวัดประสิทธิภาพความเร็ว **Tokens Per Second (TPS)** และประเมินความสามารถ **Tool / Function Calling (5 มิติ)** ของโมเดล Local AI แบบครบวงจร

---

## ✨ Key Features (ฟีเจอร์เด่น)

1. **⚡ Comprehensive Benchmark Suite:**
   - วัด **Output Generation TPS** ($\text{Tokens} / \text{Sec}$) ด้วย SSE Stream
   - วัด **TTFT (Time to First Token)** ระดับ Sub-millisecond
   - แสดงผล **Live Token Streaming Preview** และความเร็วแบบ Real-time
   - ทดสอบความสามารถ **Tool / Function Calling 5 มิติหลัก**:
     - *Single Tool Selection:* เลือกฟังก์ชันเดี่ยวและดึง Parameters
     - *Multi-Tool Routing:* เลือกเครื่องมือที่ถูกต้องจากตัวเลือก 5 tools พร้อมกัน
     - *Parallel Tool Calling:* ยิงเรียกหลาย tool calls พร้อมกันในรอบเดียว
     - *JSON Schema Strictness:* ตรวจสอบโครงสร้าง Nested Object, Array of Objects, Enums
     - *Tool Restraint (Negative Check):* ตรวจสอบว่าโมเดลไม่ hallucinate เรียก tool มั่วเมื่อถามคำถามทั่วไป
2. **📈 Context Length TPS Degradation Curve:**
   - ทดสอบและพล็อตกราฟการตกของความเร็ว (TPS) และความหน่วง (TTFT) เมื่อ Context ยาวขึ้นตั้งแต่ **512 จนถึง 8,192 Tokens**
3. **🕸️ 5-Dimension Tool Intelligence Radar:**
   - กราฟใยแมงมุม (Radar Chart) สรุปจุดแข็ง-จุดอ่อนของโมเดล พร้อมระบบให้คะแนนและ Tool Intelligence Tier Rating
4. **🧪 Interactive Tool Sandbox Simulator:**
   - หน้า Chat จำลองการคุยแบบ Multi-turn Agent ที่เมื่อโมเดลสั่งเรียก Tool ระบบจะรันจำลองผลลัพธ์จริง (Weather, Calculator, Web Search, Email, Database) แล้วส่งกลับไปให้โมเดลตอบต่อจนจบกระบวนการ
5. **💻 Real-time Hardware Telemetry Bar:**
   - ตรวจวัด System RAM (GB & %) และ CPU Usage % ระหว่างทำการทดสอบ
6. **🏆 Model Comparison Leaderboard & Report Export:**
   - บันทึกประวัติและจัดอันดับโมเดลในเครื่อง
   - ปุ่มกดส่งออกรายงานเป็น **Markdown Report** และ **JSON Data** ได้ในคลิกเดียว

---

## 🚀 วิธีเปิดใช้งาน (Quick Start)

### วิธีที่ 1: ดับเบิลคลิกไฟล์ Batch
- ดับเบิลคลิกที่ไฟล์ [`start.bat`](file:///d:/DEV/TPS/start.bat) เพื่อเปิดใช้งานแอปพลิเคชันทันที

### วิธีที่ 2: รันผ่าน Command Line
```powershell
cd d:\DEV\TPS
npm start
```

### โหมดพัฒนา (Development Mode)
```powershell
npm run electron:dev
```

---

## 🔌 การเชื่อมต่อ Local AI Backends

โปรแกรมรองรับ **OpenAI-Compatible API** ทุกแพลตฟอร์ม:
- **Ollama:** `http://localhost:11434/v1` *(กดปุ่ม Fetch Models เพื่อดึงรายชื่อโมเดลในเครื่องอัตโนมัติ)*
- **LM Studio:** `http://localhost:1234/v1`
- **vLLM / llama.cpp server:** `http://localhost:8000/v1`
- **Custom Endpoints:** ใส่ URL และ API Key ที่ต้องการได้ทันที
