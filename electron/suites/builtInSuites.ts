import { TestCase, ToolDefinition } from '../../src/types'

// Common Tools
export const COMMON_TOOLS: Record<string, ToolDefinition> = {
  get_weather: {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather and temperature for a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City and state/country, e.g. Tokyo, Japan or London, UK'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The temperature unit'
          }
        },
        required: ['location']
      }
    }
  },
  calculator: {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Perform mathematical arithmetic and evaluations',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Math expression e.g. 145 * 24 + sqrt(16)'
          }
        },
        required: ['expression']
      }
    }
  },
  web_search: {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the internet for real-time information and news',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword or query phrase'
          },
          max_results: {
            type: 'number',
            description: 'Number of results to retrieve'
          }
        },
        required: ['query']
      }
    }
  },
  send_email: {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email to a recipient',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Subject line' },
          body: { type: 'string', description: 'Body text content' }
        },
        required: ['to', 'subject', 'body']
      }
    }
  },
  query_database: {
    type: 'function',
    function: {
      name: 'query_database',
      description: 'Run SQL query on internal company database',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL SELECT query' },
          database_name: { type: 'string', description: 'Database target name' }
        },
        required: ['sql']
      }
    }
  },
  create_calendar_event: {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Schedule a new calendar meeting or event',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the event' },
          start_time: { type: 'string', description: 'ISO 8601 formatted start datetime' },
          duration_minutes: { type: 'integer', description: 'Duration in minutes' },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of email attendees'
          }
        },
        required: ['title', 'start_time']
      }
    }
  },
  configure_server: {
    type: 'function',
    function: {
      name: 'configure_server',
      description: 'Configure complex cloud server infrastructure parameters',
      parameters: {
        type: 'object',
        properties: {
          instance_type: { type: 'string', enum: ['t3.micro', 'm5.large', 'c5.2xlarge', 'g4dn.xlarge'] },
          storage: {
            type: 'object',
            properties: {
              size_gb: { type: 'integer' },
              volume_type: { type: 'string', enum: ['gp3', 'io2', 'standard'] },
              encrypted: { type: 'boolean' }
            },
            required: ['size_gb', 'volume_type']
          },
          security_groups: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                protocol: { type: 'string', enum: ['tcp', 'udp', 'icmp'] },
                port: { type: 'integer' },
                cidr: { type: 'string' }
              },
              required: ['protocol', 'port']
            }
          }
        },
        required: ['instance_type', 'storage']
      }
    }
  },
  read_pdf: {
    type: 'function',
    function: {
      name: 'read_pdf',
      description: 'Extract and parse text content, page sections, or tables from a PDF document',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'File path to the PDF document (e.g. "documents/q3_report.pdf")'
          },
          page_range: {
            type: 'string',
            description: 'Page range to extract, e.g. "1-3" or "all"'
          },
          extract_mode: {
            type: 'string',
            enum: ['text', 'tables', 'summary'],
            description: 'Extraction target mode'
          }
        },
        required: ['file_path']
      }
    }
  },
  read_image: {
    type: 'function',
    function: {
      name: 'read_image',
      description: 'Analyze image content, extract OCR text, or describe objects in an image file',
      parameters: {
        type: 'object',
        properties: {
          image_path: {
            type: 'string',
            description: 'File path or URL of the image (e.g. "images/receipt_invoice.png")'
          },
          task: {
            type: 'string',
            enum: ['ocr_text', 'describe_scene', 'detect_objects'],
            description: 'Vision analysis task'
          }
        },
        required: ['image_path']
      }
    }
  }
}

export const BUILT_IN_TEST_CASES: TestCase[] = [
  // 1. Raw Speed & TPS
  {
    id: 'tps_01_story',
    category: 'tps_speed',
    name: 'TPS Baseline - Creative Story Generation',
    description: 'Generates a 250+ token story to measure raw generation throughput and token jitter.',
    prompt: 'Write a creative sci-fi story about an autonomous AI agent exploring a forgotten space station orbiting Titan. Describe the sensors, telemetry, and discoveries in rich detail. Write around 200-300 words.',
    expectedCallType: 'none',
    maxTokens: 500
  },
  {
    id: 'tps_02_technical',
    category: 'tps_speed',
    name: 'TPS Technical - Architecture Explanation',
    description: 'Explains Transformer Attention mechanism to evaluate structured reasoning TPS.',
    prompt: 'Explain how Multi-Head Self-Attention works mathematically and conceptually in Transformer models. Provide formulas where appropriate.',
    expectedCallType: 'none',
    maxTokens: 500
  },

  // 2. Single Tool Calling
  {
    id: 'single_tool_01_weather',
    category: 'single_tool',
    name: 'Single Tool - Weather Lookup',
    description: 'Tests standard function selection and single parameter extraction.',
    prompt: 'What is the current weather in Bangkok, Thailand right now in celsius?',
    tools: [COMMON_TOOLS.get_weather],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'get_weather',
        requiredArgs: ['location']
      }
    ]
  },
  {
    id: 'single_tool_02_math',
    category: 'single_tool',
    name: 'Single Tool - Complex Calculation',
    description: 'Checks parameter formatting for mathematical expressions.',
    prompt: 'Can you compute (849 * 32) + (1024 / 4) for me?',
    tools: [COMMON_TOOLS.calculator],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'calculator',
        requiredArgs: ['expression']
      }
    ]
  },
  {
    id: 'single_tool_03_pdf',
    category: 'single_tool',
    name: 'Single Tool - PDF Document Reader',
    description: 'Evaluates file path extraction and page range arguments for PDF parsing.',
    prompt: 'Please parse and extract text from the PDF file "docs/quarterly_financial_2026.pdf" for pages 1 to 5.',
    tools: [COMMON_TOOLS.read_pdf],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'read_pdf',
        requiredArgs: ['file_path']
      }
    ]
  },
  {
    id: 'single_tool_04_image',
    category: 'single_tool',
    name: 'Single Tool - Image OCR & Vision Analysis',
    description: 'Tests image path recognition and task parameter assignment.',
    prompt: 'Perform OCR text extraction on the image located at "assets/invoice_sample_88.png".',
    tools: [COMMON_TOOLS.read_image],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'read_image',
        requiredArgs: ['image_path']
      }
    ]
  },

  // 3. Multi-Tool Routing
  {
    id: 'multi_route_01_search',
    category: 'multi_tool_routing',
    name: 'Multi-Tool Routing - Web Search Intent',
    description: 'Tests if model selects web_search among 5 available tools when asked about live news.',
    prompt: 'What are the latest breakthrough updates on DeepSeek and Gemini releases this week?',
    tools: [
      COMMON_TOOLS.get_weather,
      COMMON_TOOLS.calculator,
      COMMON_TOOLS.web_search,
      COMMON_TOOLS.send_email,
      COMMON_TOOLS.query_database
    ],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'web_search',
        requiredArgs: ['query']
      }
    ]
  },
  {
    id: 'multi_route_02_db',
    category: 'multi_tool_routing',
    name: 'Multi-Tool Routing - Database Query',
    description: 'Tests SQL tool routing when asked to retrieve customer records.',
    prompt: 'Retrieve top 10 customers sorted by lifetime_value from the production users table.',
    tools: [
      COMMON_TOOLS.get_weather,
      COMMON_TOOLS.calculator,
      COMMON_TOOLS.web_search,
      COMMON_TOOLS.send_email,
      COMMON_TOOLS.query_database
    ],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'query_database',
        requiredArgs: ['sql']
      }
    ]
  },
  {
    id: 'multi_route_03_email',
    category: 'multi_tool_routing',
    name: 'Multi-Tool Routing - Email Dispatch',
    description: 'Tests email sending tool selection with multiple parameters.',
    prompt: 'Send an email to sarah@techcorp.com with subject "Project Milestone Review" informing her that the TPS benchmarks passed with flying colors.',
    tools: [
      COMMON_TOOLS.get_weather,
      COMMON_TOOLS.calculator,
      COMMON_TOOLS.web_search,
      COMMON_TOOLS.send_email,
      COMMON_TOOLS.query_database
    ],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'send_email',
        requiredArgs: ['to', 'subject', 'body']
      }
    ]
  },

  // 4. Parallel Tool Calling
  {
    id: 'parallel_01_multi_weather',
    category: 'parallel_tool',
    name: 'Parallel Tool Calling - 3 Cities Weather',
    description: 'Tests whether model outputs multiple parallel tool calls in a single completion.',
    prompt: 'Check the weather simultaneously for Tokyo, London, and San Francisco.',
    tools: [COMMON_TOOLS.get_weather],
    expectedCallType: 'multiple',
    expectedCalls: [
      { name: 'get_weather' },
      { name: 'get_weather' },
      { name: 'get_weather' }
    ]
  },
  {
    id: 'parallel_02_batch_calc',
    category: 'parallel_tool',
    name: 'Parallel Tool Calling - Batch Math',
    description: 'Tests invoking calculation tools for separate equations in parallel.',
    prompt: 'Calculate both 500 * 1.07 and 1250 / 5 at the same time.',
    tools: [COMMON_TOOLS.calculator],
    expectedCallType: 'multiple',
    expectedCalls: [
      { name: 'calculator' },
      { name: 'calculator' }
    ]
  },

  // 5. Schema Strictness
  {
    id: 'schema_01_calendar',
    category: 'schema_strictness',
    name: 'Schema Strictness - Calendar with Array of Attendees',
    description: 'Evaluates array parsing, integer duration, and datetime strings.',
    prompt: 'Schedule a meeting named "AI Strategy Sync" for 2026-09-01T14:00:00Z lasting 45 minutes with attendees alice@example.com and bob@example.com.',
    tools: [COMMON_TOOLS.create_calendar_event],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'create_calendar_event',
        requiredArgs: ['title', 'start_time']
      }
    ]
  },
  {
    id: 'schema_02_nested_config',
    category: 'schema_strictness',
    name: 'Schema Strictness - Nested Cloud Infrastructure',
    description: 'Evaluates deep nested objects, enums, booleans, and security group arrays.',
    prompt: 'Provision a cloud server with instance_type "m5.large", a 200GB gp3 encrypted storage volume, and a security group opening TCP port 443.',
    tools: [COMMON_TOOLS.configure_server],
    expectedCallType: 'single',
    expectedCalls: [
      {
        name: 'configure_server',
        requiredArgs: ['instance_type', 'storage']
      }
    ]
  },

  // 6. Tool Restraint (Negative Testing)
  {
    id: 'restraint_01_general_knowledge',
    category: 'tool_restraint',
    name: 'Tool Restraint - General Knowledge Query',
    description: 'Tests if model refrains from calling tools when answering simple questions.',
    prompt: 'What color is the sky on a clear sunny day and why does it appear that color?',
    tools: [
      COMMON_TOOLS.get_weather,
      COMMON_TOOLS.calculator,
      COMMON_TOOLS.web_search,
      COMMON_TOOLS.send_email
    ],
    expectedCallType: 'none',
    expectedTextKeywords: ['blue', 'scattering', 'rayleigh']
  },
  {
    id: 'restraint_02_casual_greeting',
    category: 'tool_restraint',
    name: 'Tool Restraint - Casual Conversation',
    description: 'Ensures no tool is triggered on simple conversational prompts.',
    prompt: 'Hello! Who are you and what can you help me with?',
    tools: [
      COMMON_TOOLS.get_weather,
      COMMON_TOOLS.calculator,
      COMMON_TOOLS.web_search,
      COMMON_TOOLS.send_email,
      COMMON_TOOLS.query_database
    ],
    expectedCallType: 'none'
  }
]

export const CONTEXT_LENGTH_PROMPTS: Array<{ size: number; promptGenerator: () => string }> = [
  {
    size: 512,
    promptGenerator: () => generateDummyContext(260) + '\n\nSummarize the main focus of the text above in 2 sentences.'
  },
  {
    size: 1024,
    promptGenerator: () => generateDummyContext(580) + '\n\nSummarize the main focus of the text above in 2 sentences.'
  },
  {
    size: 2048,
    promptGenerator: () => generateDummyContext(1200) + '\n\nSummarize the main focus of the text above in 2 sentences.'
  },
  {
    size: 4096,
    promptGenerator: () => generateDummyContext(2500) + '\n\nSummarize the main focus of the text above in 2 sentences.'
  },
  {
    size: 8192,
    promptGenerator: () => generateDummyContext(5200) + '\n\nSummarize the main focus of the text above in 2 sentences.'
  }
]

function generateDummyContext(wordCount: number): string {
  const sampleParagraph = 'The advancement of local artificial intelligence models has revolutionized on-device computing. High-efficiency inference engines like llama.cpp and vLLM enable low-latency execution across heterogeneous architectures including GPUs and Apple Silicon NPUs. Quantitative evaluation of prompt evaluation throughput and generation token rates is vital for optimizing agentic workflows, function calling routing, and complex task decomposition. '
  const repeatCount = Math.ceil(wordCount / sampleParagraph.split(' ').length)
  return Array(repeatCount).fill(sampleParagraph).join('\n')
}
