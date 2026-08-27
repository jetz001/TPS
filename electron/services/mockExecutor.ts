import https from 'https'
import http from 'http'

// In-memory Database Table for real SQL querying simulation
const IN_MEMORY_DB: Record<string, any[]> = {
  users: [
    { id: 1, name: 'Somchai Prasert', email: 'somchai@example.com', role: 'Admin', lifetime_value: 85000 },
    { id: 2, name: 'Alice Johnson', email: 'alice@techcorp.com', role: 'Manager', lifetime_value: 48500 },
    { id: 3, name: 'Bob Smith', email: 'bob@example.com', role: 'Customer', lifetime_value: 12000 },
    { id: 4, name: 'Carol Danvers', email: 'carol@marvel.com', role: 'VIP', lifetime_value: 99000 },
    { id: 5, name: 'David Miller', email: 'david@domain.com', role: 'Customer', lifetime_value: 3100 }
  ],
  products: [
    { id: 101, title: 'RTX 4090 24GB', stock: 12, price_thb: 68900 },
    { id: 102, title: 'Mac Studio M2 Ultra', stock: 5, price_thb: 149900 },
    { id: 103, title: 'Ollama Dedicated Server', stock: 20, price_thb: 45000 }
  ]
}

export async function executeMockTool(name: string, args: Record<string, any>): Promise<{ result: any; status: 'success' | 'error' }> {
  try {
    switch (name) {
      // 1. Real Math Calculator
      case 'calculator': {
        const expr = String(args.expression || args.expr || '')
        // Clean and normalize math expression
        let processed = expr
          .replace(/Math\./gi, '')
          .replace(/sqrt\(/gi, 'Math.sqrt(')
          .replace(/pow\(/gi, 'Math.pow(')
          .replace(/abs\(/gi, 'Math.abs(')
          .replace(/round\(/gi, 'Math.round(')
          .replace(/sin\(/gi, 'Math.sin(')
          .replace(/cos\(/gi, 'Math.cos(')
          .replace(/pi\b/gi, 'Math.PI')

        // Remove any dangerous characters except standard math
        const sanitized = processed.replace(/[^0-9+\-*/().%^ MathPIE,absminaxqrtow]/g, '')
        const calculated = Function(`"use strict"; return (${sanitized})`)()

        return {
          status: 'success',
          result: {
            expression: expr,
            evaluated_value: calculated,
            type: 'number'
          }
        }
      }

      // 2. Real Live Weather via Open-Meteo (Free Open API)
      case 'get_weather': {
        const loc = args.location || 'Bangkok'
        const unit = args.unit || 'celsius'
        try {
          // Geocode city
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
          const geoData = await fetchJson(geoUrl)
          if (geoData?.results?.[0]) {
            const { latitude, longitude, name: cityName, country } = geoData.results[0]
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=${unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'}`
            const wData = await fetchJson(weatherUrl)
            if (wData?.current) {
              return {
                status: 'success',
                result: {
                  location: `${cityName}, ${country}`,
                  temperature: `${wData.current.temperature_2m}°${unit === 'fahrenheit' ? 'F' : 'C'}`,
                  humidity: `${wData.current.relative_humidity_2m}%`,
                  wind_speed: `${wData.current.wind_speed_10m} km/h`,
                  live_source: 'Open-Meteo Realtime Weather API'
                }
              }
            }
          }
        } catch {
          // fallback if offline
        }

        const fallbackTemp = unit === 'fahrenheit' ? 82 : 29
        return {
          status: 'success',
          result: {
            location: loc,
            temperature: `${fallbackTemp}°${unit === 'fahrenheit' ? 'F' : 'C'}`,
            condition: 'Clear Sky',
            humidity: '60%'
          }
        }
      }

      // 3. Web Search Engine
      case 'web_search': {
        const query = args.query || ''
        return {
          status: 'success',
          result: {
            query,
            total_results: 3,
            results: [
              {
                title: `${query} - Official Releases & Documentation`,
                snippet: `Complete benchmark insights, performance throughput, and technical analysis regarding ${query}.`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
              },
              {
                title: `${query} - Community Benchmarks & Performance Guide`,
                snippet: `Detailed community tests and quantization results for ${query} on local hardware.`,
                url: `https://github.com/topics/${encodeURIComponent(query)}`
              }
            ]
          }
        }
      }

      // 4. In-Memory Database SQL Query Execution
      case 'query_database': {
        const sql = String(args.sql || '').toLowerCase()
        let returnedRows: any[] = []

        if (sql.includes('product')) {
          returnedRows = IN_MEMORY_DB.products
        } else {
          returnedRows = IN_MEMORY_DB.users
        }

        if (sql.includes('order by') && sql.includes('lifetime_value')) {
          returnedRows = [...returnedRows].sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0))
        }
        if (sql.includes('limit')) {
          const match = sql.match(/limit\s+(\d+)/)
          const limit = match ? parseInt(match[1]) : 10
          returnedRows = returnedRows.slice(0, limit)
        }

        return {
          status: 'success',
          result: {
            sql: args.sql,
            rows_count: returnedRows.length,
            data: returnedRows
          }
        }
      }

      // 5. Send Email Tool
      case 'send_email': {
        return {
          status: 'success',
          result: {
            status: 'delivered',
            message_id: `msg_${Math.random().toString(36).substring(2, 9)}`,
            to: args.to,
            subject: args.subject,
            sent_at: new Date().toISOString()
          }
        }
      }

      // 6. Create Calendar Event
      case 'create_calendar_event': {
        return {
          status: 'success',
          result: {
            event_id: `evt_${Date.now()}`,
            title: args.title,
            start_time: args.start_time,
            duration_minutes: args.duration_minutes || 30,
            status: 'confirmed',
            created_at: new Date().toISOString()
          }
        }
      }

      // 7. Read PDF Document Tool
      case 'read_pdf': {
        const filePath = String(args.file_path || '')
        const pageRange = args.page_range || '1-5'
        const mode = args.extract_mode || 'text'
        return {
          status: 'success',
          result: {
            file_name: filePath.split('/').pop() || filePath.split('\\').pop() || filePath,
            file_path: filePath,
            total_pages: 14,
            extracted_pages: pageRange,
            extract_mode: mode,
            content: `[Document Extracted: ${filePath}]\n\n--- Executive Summary (Pages ${pageRange}) ---\n1. Financial Performance: Total Q3 revenue increased by 28.4% YoY to $4.2M.\n2. AI Infrastructure: Transitioned 100% of inference pipelines to local on-premise hardware.\n3. Operational Expenses: Reduced external cloud API costs by 64% through optimized GGUF model quantization.\n4. Key Milestones: Successfully deployed custom agentic workflow tools across internal departments.`,
            status: 'parsed_successfully'
          }
        }
      }

      // 8. Read Image / OCR Vision Tool
      case 'read_image': {
        const imgPath = String(args.image_path || '')
        const task = args.task || 'ocr_text'
        return {
          status: 'success',
          result: {
            image_name: imgPath.split('/').pop() || imgPath.split('\\').pop() || imgPath,
            image_path: imgPath,
            dimensions: '1920x1080',
            task,
            detected_text: task === 'ocr_text' ? [
              "INVOICE #INV-2026-8891",
              "BILL TO: ACME CORPORATION",
              "DATE: 2026-08-20",
              "ITEM 1: High-Performance GPU Inference Node (1x) - $4,850.00",
              "ITEM 2: Local AI Benchmark Suite Pro (Unlimited) - $950.00",
              "SUBTOTAL: $5,800.00",
              "TAX (7%): $406.00",
              "TOTAL AMOUNT DUE: $6,206.00",
              "PAYMENT STATUS: COMPLETED"
            ].join('\n') : undefined,
            visual_analysis: task !== 'ocr_text' ? {
              detected_objects: ['document', 'invoice_header', 'table_grid', 'qr_code', 'signature_box'],
              confidence: 0.98,
              scene: 'Scanned commercial invoice document with high clarity'
            } : undefined
          }
        }
      }

      default:
        return {
          status: 'success',
          result: {
            message: `Tool "${name}" executed successfully`,
            arguments: args
          }
        }
    }
  } catch (err: any) {
    return {
      status: 'error',
      result: { error: err.message }
    }
  }
}

function fetchJson(urlStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { headers: { 'User-Agent': 'LocalAIBenchmark/1.0' }, timeout: 4000 }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}
