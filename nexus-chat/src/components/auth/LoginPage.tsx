/**
 * 登录页面组件
 *
 * 职责：
 * - 提供多种登录方式（邮箱魔法链接、邮箱密码）
 * - 处理用户注册
 * - 管理登录状态和错误提示
 *
 * 登录模式：
 * - email: 魔法链接登录（发送邮件链接）
 * - login: 邮箱密码登录
 * - register: 邮箱密码注册
 */
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

import { Button, Input } from '@/components/ui'
import { LoaderIcon } from '@/components/ui/Icons'

import styles from './LoginPage.module.css'

// 认证模式类型
type AuthMode = 'email' | 'login' | 'register'

export function LoginPage() {
    // 状态管理
    const [mode, setMode] = useState<AuthMode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    /**
     * 邮箱魔法链接登录
     * 发送包含登录链接的邮件
     */
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) {
            setError('请输入邮箱地址')
            return
        }

        setLoading(true)

        try {
            const result = await signIn('email', {
                email: email.trim(),
                redirect: false
            })

            if (result?.error) {
                throw new Error(result.error)
            }

            setSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : '发送验证邮件失败')
        } finally {
            setLoading(false)
        }
    }

    /**
     * 邮箱密码注册/登录
     * 注册时先创建账户，再登录
     */
    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('请输入邮箱和密码')
            return
        }

        if (mode === 'register' && !name.trim()) {
            setError('请输入用户名')
            return
        }

        setLoading(true)

        try {
            if (mode === 'register') {
                // 先注册账户
                const registerRes = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.trim(), password, name: name.trim() })
                })

                if (!registerRes.ok) {
                    const data = await registerRes.json()
                    throw new Error(data.error || '注册失败')
                }
            }

            // 登录
            const result = await signIn('credentials', {
                email: email.trim(),
                password,
                redirect: false
            })

            if (result?.error) {
                throw new Error(result.error)
            }

            // 登录成功，刷新页面
            window.location.reload()
        } catch (err) {
            setError(err instanceof Error ? err.message : '登录失败')
        } finally {
            setLoading(false)
        }
    }

    // 魔法链接发送成功提示
    if (sent) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.iconWrapper}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.mailIcon}>
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </div>
                    <h1 className={styles.title}>检查您的邮箱</h1>
                    <p className={styles.description}>
                        我们已向 <span className={styles.email}>{email}</span> 发送了登录链接，请点击链接完成登录。
                    </p>
                    <Button variant="ghost" onClick={() => setSent(false)} fullWidth>
                        使用其他邮箱
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>N</span>
                </div>
                <h1 className={styles.title}>欢迎来到 Nexus Chat</h1>
                <p className={styles.description}>
                    {mode === 'email' ? '输入邮箱获取登录链接' : mode === 'register' ? '创建新账户' : '使用邮箱和密码登录'}
                </p>

                {/* 魔法链接登录表单 */}
                {mode === 'email' ? (
                    <form onSubmit={handleEmailLogin} className={styles.form}>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            disabled={loading}
                        />

                        {error && <p className={styles.error}>{error}</p>}

                        <Button type="submit" fullWidth loading={loading} disabled={loading}>
                            {loading ? <LoaderIcon size={18} /> : '发送登录链接'}
                        </Button>
                    </form>
                ) : (
                    /* 邮箱密码登录/注册表单 */
                    <form onSubmit={handleCredentialsLogin} className={styles.form}>
                        {mode === 'register' && (
                            <Input
                                type="text"
                                placeholder="用户名"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                disabled={loading}
                            />
                        )}
                        <Input
                            type="email"
                            placeholder="邮箱地址"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            disabled={loading}
                        />
                        <Input
                            type="password"
                            placeholder="密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            disabled={loading}
                        />

                        {error && <p className={styles.error}>{error}</p>}

                        <Button type="submit" fullWidth loading={loading} disabled={loading}>
                            {loading ? <LoaderIcon size={18} /> : mode === 'register' ? '注册' : '登录'}
                        </Button>
                    </form>
                )}

                {/* 切换登录模式 */}
                <div className={styles.switchMode}>
                    {mode === 'email' ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode('login')}
                        >
                            使用密码登录
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode('email')}
                            >
                                使用魔法链接
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            >
                                {mode === 'login' ? '创建新账户' : '已有账户？登录'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
