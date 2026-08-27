import React, { useState } from 'react'
import { HelpCircle, X, Zap, Clock, Hash, Activity, Layers, ShieldCheck, Database, Wrench } from 'lucide-react'

export const MetricsGlossary: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-light hover:bg-surface-lighter border border-surface-lighter text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-all"
        title="Metrics & Parameters Reference Guide"
      >
        <HelpCircle className="w-3.5 h-3.5 text-accent-cyan" />
        <span>📖 คู่มืออธิบายพารามิเตอร์</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface border border-surface-lighter rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-surface-light flex items-center justify-between bg-surface-light/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">คู่มืออธิบายพารามิเตอร์ & ตัวชี้วัด (Metrics Glossary)</h3>
                  <p className="text-xs text-slate-400">ความหมายของตัวเลขและค่าชี้วัดประสิทธิภาพทั้งหมดในโปรแกรม</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-lighter text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans leading-relaxed">
              {/* 1. Speed Metrics */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2 border-b border-surface-light pb-2">
                  <Zap className="w-4 h-4 text-accent-amber" /> 1. ตัวชี้วัดความเร็วและ Throughput
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                  <div className="bg-background p-3.5 rounded-xl border border-surface-light space-y-1">
                    <div className="flex items-center justify-between text-accent-amber font-bold">
                      <span>TPS (Tokens Per Second)</span>
                      <span className="text-[10px] bg-accent-amber/10 px-1.5 py-0.5 rounded">Output Speed</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">
                      จำนวน <strong>Token ที่โมเดลสร้างออกมาได้ต่อ 1 วินาที</strong> ยิ่งค่าสูงแสดงว่าโมเดลตอบได้เร็ว พิมพ์ข้อความต่อเนื่องได้ลื่นไหล
                    </p>
                  </div>

                  <div className="bg-background p-3.5 rounded-xl border border-surface-light space-y-1">
                    <div className="flex items-center justify-between text-accent-cyan font-bold">
                      <span>TTFT (Time to First Token)</span>
                      <span className="text-[10px] bg-accent-cyan/10 px-1.5 py-0.5 rounded">ms (Latency)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">
                      <strong>เวลาตั้งแต่ส่งคำถามจนถึง Token แรกเริ่มตอบออกมา</strong> วัดความหน่วงในการประมวลผล Prompt ยิ่งน้อยยิ่งตอบสนองไว
                    </p>
                  </div>

                  <div className="bg-background p-3.5 rounded-xl border border-surface-light space-y-1">
                    <div className="flex items-center justify-between text-accent-emerald font-bold">
                      <span>Synthesis Speed (TPS)</span>
                      <span className="text-[10px] bg-accent-emerald/10 px-1.5 py-0.5 rounded">Turn 2 Speed</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">
                      ความเร็ว TPS ในรอบที่สอง เมื่อโมเดลได้รับข้อมูลจาก Tool กลับมาแล้วนำมาสังเคราะห์เป็นคำตอบภาษาธรรมชาติ
                    </p>
                  </div>

                  <div className="bg-background p-3.5 rounded-xl border border-surface-light space-y-1">
                    <div className="flex items-center justify-between text-accent-violet font-bold">
                      <span>Total Duration</span>
                      <span className="text-[10px] bg-accent-violet/10 px-1.5 py-0.5 rounded">Seconds</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">
                      เวลาการทำงานจริงทั้งหมดตั้งแต่เริ่มส่งคำสั่งจนโมเดลพิมพ์จบสมบูรณ์ (รวมทั้งรอบเรียก Tool และรอบสังเคราะห์คำตอบ)
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Tool Dimensions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2 border-b border-surface-light pb-2">
                  <ShieldCheck className="w-4 h-4 text-accent-emerald" /> 2. มิติการประเมินความฉลาดของ Tool Calling (5 มิติ)
                </h4>
                <div className="space-y-2.5">
                  <div className="bg-background p-3 rounded-xl border border-surface-light flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-accent-cyan mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-100 font-mono text-xs">Single Tool Selection:</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ความสามารถในการเลือกฟังก์ชันเดี่ยวได้ถูกต้อง และแยกแยะพารามิเตอร์ที่จำเป็น (เช่น ดึงชื่อเมืองออกมาใส่ช่อง <code className="text-accent-cyan">location</code>)
                      </p>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-accent-amber mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-100 font-mono text-xs">Multi-Tool Routing:</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        เมื่อมีเครื่องมือให้เลือก 5 ตัวพร้อมกัน (Search, Calc, Mail, DB, Weather) โมเดลสามารถวิเคราะห์เจตนา (Intent) และเลือกใช้เครื่องมือที่ตรงกับงานได้ถูกต้อง ไม่สับสน
                      </p>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-accent-emerald mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-100 font-mono text-xs">Parallel Tool Calling:</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ความสามารถในการส่ง Tool Calls หลายชุดพร้อมกันใน 1 คำตอบเมื่อผู้ใช้สั่งหลายคำสั่งพร้อมกัน (เช่น เช็คสภาพอากาศ 3 เมืองในรอบเดียว)
                      </p>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-100 font-mono text-xs">JSON Schema Strictness:</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ความแม่นยำในการสร้าง JSON ตามกฎเข้มงวด เช่น รองรับ Nested Object ซ้อนหลายชั้น, Array of Objects, ชนิดข้อมูลตัวเลข/บูลีน, และค่า Enum ที่กำหนด
                      </p>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-accent-rose mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-100 font-mono text-xs">Tool Restraint (Negative Check):</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ความยับยั้งชั่งใจไม่เรียกเครื่องมือมั่ว เมื่อถามคำถามทั่วไปที่ไม่จำเป็นต้องใช้ Tool (เช่น "ท้องฟ้าสีอะไร") โมเดลต้องตอบเป็นข้อความธรรมดา ไม่ Hallucinate
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Available Tools & Parameters */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2 border-b border-surface-light pb-2">
                  <Wrench className="w-4 h-4 text-accent-cyan" /> 3. พารามิเตอร์ของแต่ละ Tool ในโปรแกรม
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-[11px]">
                  <div className="bg-background p-3 rounded-xl border border-surface-light">
                    <div className="font-bold text-accent-cyan">get_weather</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-sans">
                      • <code className="text-slate-200">location</code>: ชื่อเมือง/ประเทศ<br />
                      • <code className="text-slate-200">unit</code>: celsius หรือ fahrenheit
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light">
                    <div className="font-bold text-accent-cyan">calculator</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-sans">
                      • <code className="text-slate-200">expression</code>: สมการคณิตศาสตร์ เช่น 145 * 24 + sqrt(16)
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light">
                    <div className="font-bold text-accent-cyan">web_search</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-sans">
                      • <code className="text-slate-200">query</code>: คำค้นหาข่าว/ข้อมูลสดบนอินเทอร์เน็ต<br />
                      • <code className="text-slate-200">max_results</code>: จำนวนผลลัพธ์
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light">
                    <div className="font-bold text-accent-cyan">read_pdf</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-sans">
                      • <code className="text-slate-200">file_path</code>: ที่อยู่ไฟล์ PDF<br />
                      • <code className="text-slate-200">page_range</code>: ช่วงหน้า เช่น "1-5"<br />
                      • <code className="text-slate-200">extract_mode</code>: text, tables, summary
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light">
                    <div className="font-bold text-accent-cyan">read_image</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-sans">
                      • <code className="text-slate-200">image_path</code>: ที่อยู่ไฟล์รูปภาพ (PNG/JPG)<br />
                      • <code className="text-slate-200">task</code>: ocr_text, describe_scene, detect_objects
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-surface-light">
                    <div className="font-bold text-accent-cyan">query_database</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-sans">
                      • <code className="text-slate-200">sql</code>: คำสั่ง SQL SELECT query บนตาราง users, products
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-light bg-surface-light/30 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold font-mono"
              >
                เข้าใจแล้ว (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
