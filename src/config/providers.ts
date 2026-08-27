import { ProviderPreset } from '../types'

export const PROVIDER_PRESETS: ProviderPreset[] = [
  // --- Local Providers ---
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'local',
    defaultUrl: 'http://localhost:11434/v1',
    recommendedModels: [
      'qwen2.5:0.5b',
      'qwen2.5-coder:7b',
      'deepseek-r1:8b',
      'llama3.3:8b',
      'mistral:7b'
    ]
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    type: 'local',
    defaultUrl: 'http://localhost:1234/v1',
    recommendedModels: [
      'local-model',
      'qwen2.5-coder-7b-instruct',
      'deepseek-r1-distill-qwen-7b'
    ]
  },
  {
    id: 'vllm',
    name: 'vLLM / llama.cpp',
    type: 'local',
    defaultUrl: 'http://localhost:8000/v1',
    recommendedModels: [
      'default',
      'Qwen/Qwen2.5-7B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct'
    ]
  },

  // --- Cloud Providers ---
  {
    id: 'ollama_cloud',
    name: 'Ollama Cloud 🦙',
    type: 'cloud',
    defaultUrl: 'https://ollama.com/v1',
    envKeyNames: ['OLLAMA_API_KEY', 'RESEARCH_API_KEY'],
    recommendedModels: [
      'gpt-oss:120b',
      'qwen2.5:72b',
      'deepseek-r1:70b',
      'llama3.3:70b'
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'cloud',
    defaultUrl: 'https://openrouter.ai/api/v1',
    envKeyNames: ['OPENROUTER_API_KEY'],
    recommendedModels: [
      'anthropic/claude-3.7-sonnet',
      'openai/gpt-4o',
      'deepseek/deepseek-r1',
      'deepseek/deepseek-chat',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct'
    ],
    docsUrl: 'https://openrouter.ai/keys'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'cloud',
    defaultUrl: 'https://api.deepseek.com/v1',
    envKeyNames: ['DEEPSEEK_API_KEY'],
    recommendedModels: [
      'deepseek-chat',
      'deepseek-reasoner'
    ],
    docsUrl: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'groq',
    name: 'Groq (Ultra-Fast)',
    type: 'cloud',
    defaultUrl: 'https://api.groq.com/openai/v1',
    envKeyNames: ['GROQ_API_KEY'],
    recommendedModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'deepseek-r1-distill-llama-70b',
      'mixtral-8x7b-32768'
    ],
    docsUrl: 'https://console.groq.com/keys'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'cloud',
    defaultUrl: 'https://api.openai.com/v1',
    envKeyNames: ['OPENAI_API_KEY'],
    recommendedModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'o3-mini',
      'gpt-4-turbo'
    ],
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'cloud',
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    envKeyNames: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    recommendedModels: [
      'gemini-2.0-flash',
      'gemini-2.0-pro-exp-02-05',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ],
    docsUrl: 'https://aistudio.google.com/app/apikey'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    type: 'cloud',
    defaultUrl: 'https://api.mistral.ai/v1',
    envKeyNames: ['MISTRAL_API_KEY', 'WRITER_API_KEY', 'QA_API_KEY', 'ADVISOR_API_KEY'],
    recommendedModels: [
      'mistral-small-latest',
      'mistral-large-latest',
      'codestral-latest',
      'open-mistral-nemo'
    ],
    docsUrl: 'https://console.mistral.ai/api-keys'
  },
  {
    id: 'together',
    name: 'Together AI',
    type: 'cloud',
    defaultUrl: 'https://api.together.xyz/v1',
    envKeyNames: ['TOGETHER_API_KEY'],
    recommendedModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'deepseek-ai/DeepSeek-R1',
      'deepseek-ai/DeepSeek-V3',
      'Qwen/Qwen2.5-72B-Instruct-Turbo'
    ],
    docsUrl: 'https://api.together.ai/settings/api-keys'
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    type: 'cloud',
    defaultUrl: 'https://api.example.com/v1',
    recommendedModels: ['custom-model']
  }
]
