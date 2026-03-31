import '@testing-library/jest-dom'

// ==================== Node.js Polyfills ====================
// Next.js API 路由测试需要 Request/Response 等 Web API

// 模拟 Request - 使用 getter 属性
class MockRequest {
  private _url: string
  private _method: string
  private _headers: Headers
  private _body: string

  constructor(url: string, init?: RequestInit) {
    this._url = url
    this._method = init?.method || 'GET'
    this._headers = new Headers(init?.headers as Record<string, string>)
    this._body = init?.body as string || ''
  }

  get url() { return this._url }
  get method() { return this._method }
  get headers() { return this._headers }

  async json() {
    return JSON.parse(this._body)
  }

  async text() {
    return this._body
  }
}

// 模拟 Response
class MockResponse {
  private _status: number
  private _statusText: string
  private _headers: Headers
  private _body: string

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this._status = init?.status || 200
    this._statusText = init?.statusText || ''
    this._headers = new Headers(init?.headers as Record<string, string>)
    // 处理 body 为 null 或 undefined 的情况
    if (body === null || body === undefined) {
      this._body = ''
    } else if (typeof body === 'string') {
      this._body = body
    } else {
      this._body = String(body)
    }
  }

  get status() { return this._status }
  get statusText() { return this._statusText }
  get headers() { return this._headers }

  async json() {
    if (!this._body || this._body.trim() === '') {
      return null
    }
    return JSON.parse(this._body)
  }

  async text() {
    return this._body
  }

  static json(data: unknown, init?: ResponseInit) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  }
}

// 注入到全局
global.Request = MockRequest as unknown as typeof Request
global.Response = MockResponse as unknown as typeof Response

// 模拟 Headers
global.Headers = class MockHeaders {
  private _headers: Map<string, string>

  constructor(init?: HeadersInit) {
    this._headers = new Map()
    if (init) {
      const initObj = init as Record<string, string>
      Object.entries(initObj).forEach(([key, value]) => {
        this._headers.set(key.toLowerCase(), value)
      })
    }
  }

  get(name: string) {
    return this._headers.get(name.toLowerCase()) || null
  }

  set(name: string, value: string) {
    this._headers.set(name.toLowerCase(), value)
  }
} as unknown as typeof Headers

// Mock NextRequest 和 NextResponse
jest.mock('next/server', () => {
  class MockNextRequest {
    private _url: string
    private _method: string
    private _headers: Headers
    private _body: string

    constructor(url: string, init?: RequestInit) {
      this._url = url
      this._method = init?.method || 'GET'
      this._headers = new Headers(init?.headers as Record<string, string>)
      this._body = init?.body as string || ''
    }

    get url() { return this._url }
    get method() { return this._method }
    get headers() { return this._headers }

    async json() {
      if (!this._body || this._body.trim() === '') {
        return {}
      }
      return JSON.parse(this._body)
    }

    async text() {
      return this._body
    }
  }

  class MockNextResponse {
    private _status: number
    private _statusText: string
    private _headers: Headers
    private _body: string

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this._status = init?.status || 200
      this._statusText = init?.statusText || ''
      this._headers = new Headers(init?.headers as Record<string, string>)
      // 处理 body 为 null 或 undefined 的情况
      if (body === null || body === undefined) {
        this._body = ''
      } else if (typeof body === 'string') {
        this._body = body
      } else {
        this._body = String(body)
      }
    }

    get status() { return this._status }
    get statusText() { return this._statusText }
    get headers() { return this._headers }

    async json() {
      if (!this._body || this._body.trim() === '') {
        return null
      }
      return JSON.parse(this._body)
    }

    async text() {
      return this._body
    }
  }

  // 使用 jest.fn 包装 NextResponse.json 以支持 mock
  const NextResponseJson = jest.fn((data: unknown, init?: ResponseInit) => ({
    status: init?.status || 200,
    json: async () => data,
  }))

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: NextResponseJson,
    },
  }
})

// 模拟 next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(() => Promise.resolve({ error: null })),
  signOut: jest.fn(() => Promise.resolve()),
}))

// 模拟 next-auth
jest.mock('next-auth', () => ({
  AuthOptions: {},
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id' }
  })),
}))

// 模拟 Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    friendship: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    aISuggestionUsage: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
    },
    aISuggestionFeedback: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// 模拟 socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}))

// 模拟 zustand stores - 必须返回函数形式
jest.mock('@/stores', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user-id', name: 'Test User' },
    status: 'authenticated',
  }),
  useChatStore: () => ({
    conversations: [],
    currentConversation: null,
    messages: {},
    friends: [],
    pendingRequests: [],
    setConversations: jest.fn(),
    setCurrentConversation: jest.fn(),
    setMessages: jest.fn(),
    addMessage: jest.fn(),
  }),
  useUIStore: () => ({
    sidebarOpen: true,
    toggleSidebar: jest.fn(),
  }),
  useAISuggestionStore: () => ({
    isSuggestionPanelOpen: false,
    isPrivacyNoticeOpen: false,
    selectedSuggestionContent: null,
    openSuggestionPanel: jest.fn(),
    closeSuggestionPanel: jest.fn(),
    toggleSuggestionPanel: jest.fn(),
    openPrivacyNotice: jest.fn(),
    closePrivacyNotice: jest.fn(),
    setSelectedSuggestion: jest.fn(),
  }),
}))

// 模拟 useSocket hook
jest.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    startTyping: jest.fn(),
    stopTyping: jest.fn(),
  }),
}))

// ==================== AI 相关 Mock ====================

// 模拟 AI 配置
jest.mock('@/lib/ai/config', () => ({
  AI_CONFIG: {
    provider: 'alibaba',
    model: 'qwen-flash',
    apiKey: 'test-api-key',
    suggestionCount: 3,
    dailyLimit: 20,
    timeout: 10000,
    maxRetries: 2,
  },
  AI_PROVIDER_CONFIG: {
    alibaba: {
      name: '阿里云通义千问',
      defaultModel: 'qwen-flash',
      apiKeyEnv: 'ALIBABA_API_KEY',
      models: ['qwen-flash', 'qwen-turbo', 'qwen-plus', 'qwen-max'],
    },
    deepseek: {
      name: 'DeepSeek',
      defaultModel: 'deepseek-chat',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      models: ['deepseek-chat', 'deepseek-coder'],
    },
    zhipu: {
      name: '智谱清言',
      defaultModel: 'glm-4-flash',
      apiKeyEnv: 'ZHIPU_API_KEY',
      models: ['glm-4-flash', 'glm-4', 'glm-4-plus'],
    },
    openai: {
      name: 'OpenAI',
      defaultModel: 'gpt-4-turbo-preview',
      apiKeyEnv: 'OPENAI_API_KEY',
      models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    },
  },
  AI_LIMITS: {
    maxMessagesPerRequest: 20,
    maxMessageLength: 500,
    minMessagesForSuggestion: 2,
    maxSuggestionLength: 100,
    cacheTTL: 5 * 60 * 1000,
  },
  AI_ERROR_MESSAGES: {
    RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后再试',
    DAILY_LIMIT_EXCEEDED: '今日使用次数已达上限，请明天再来',
    TIMEOUT: 'AI 服务响应超时，请稍后重试',
    API_ERROR: 'AI 服务暂时不可用，请稍后重试',
    INVALID_RESPONSE: 'AI 返回了无效的响应',
    PROVIDER_UNAVAILABLE: 'AI 提供商服务不可用',
    NO_MESSAGES: '消息数量不足，无法生成建议',
    UNKNOWN: '发生未知错误，请稍后重试',
  },
  isAIConfigValid: jest.fn(() => true),
  getProviderApiKey: jest.fn(() => 'test-api-key'),
  createProvider: jest.fn(() => jest.fn(() => 'mock-model')),
}))

// 模拟 localStorage
const localStorageMock = (() => {
  const store = new Map<string, string>()
  return {
    getItem: jest.fn((key: string) => store.get(key) || null),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key)
    }),
    clear: jest.fn(() => {
      store.clear()
    }),
    get store() {
      const plainStore: Record<string, string> = {}
      for (const [key, value] of store.entries()) {
        // 使用 Object.defineProperty 避免对象注入风险
        Object.defineProperty(plainStore, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        })
      }
      return plainStore
    },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// 模拟 ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// 模拟 IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// 全局 fetch 模拟
global.fetch = jest.fn()

// 清理每次测试后的 mock
// 注意：不使用 jest.clearAllMocks() 或 jest.resetAllMocks()
// 因为它们会清除 mock 实现（mockImplementation）
// 解决方案：在每个测试的 beforeEach 中重新设置 mock 实现
afterEach(() => {
  // 不使用 jest.clearAllMocks()，因为它会清除 mockImplementation
  localStorageMock.clear()
})

// 在每个测试前重新设置关键 mock
beforeEach(() => {
  // 重新设置 next-auth mock
  const nextAuth = require('next-auth')
  if (nextAuth.getServerSession && typeof nextAuth.getServerSession.mockReturnValue === 'function') {
    nextAuth.getServerSession.mockReturnValue(
      Promise.resolve({
        user: { id: 'test-user-id' },
      })
    )
  }

  // 重新设置 NextResponse.json mock 实现
  const { NextResponse } = require('next/server')
  if (NextResponse.json) {
    NextResponse.json.mockImplementation((data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
    }))
  }
})
