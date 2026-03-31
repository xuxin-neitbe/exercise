'use client'

import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'

import { LoginPage } from '@/components/auth'
import { ChatLayout } from '@/components/chat'
import { useAuthStore } from '@/stores'

function AppContent() {
  const { data: session, status } = useSession()
  const { setSession, setStatus } = useAuthStore()

  // 同步 NextAuth session 到 Zustand store
  useEffect(() => {
    setStatus(status)
    if (session) {
      setSession(session)
    }
  }, [session, status, setSession, setStatus])

  // 加载中
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录，显示登录页
  if (status === 'unauthenticated') {
    return <LoginPage />
  }

  // 已登录，显示聊天界面
  return <ChatLayout />
}

export default function Home() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}
