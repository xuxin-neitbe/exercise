/**
 * AI 建议按钮组件
 *
 * 用于触发 AI 建议生成的按钮
 */

'use client'

import React from 'react'

import styles from './AISuggestionButton.module.css'

interface AISuggestionButtonProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  isLoading?: boolean
  remainingUsage?: number
  error?: string | null
}

/**
 * AI 建议按钮组件
 */
export function AISuggestionButton({
  onClick,
  disabled = false,
  className = '',
  isLoading = false,
  remainingUsage = 20,
  error,
}: AISuggestionButtonProps) {
  // 检查是否达到使用限制
  const isLimitReached = remainingUsage === 0

  // 按钮是否禁用
  const isDisabled = disabled || isLoading || isLimitReached

  // 点击处理
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick()
    }
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${className} ${isDisabled ? styles.disabled : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="获取 AI 回复建议"
      aria-disabled={isDisabled}
      aria-busy={isLoading}
    >
      {/* AI 图标 */}
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>

      {/* 按钮文字 */}
      <span className={styles.text}>
        {isLoading ? '生成中...' : isLimitReached ? '已达上限' : '帮我回答'}
      </span>

      {/* 剩余次数 */}
      {!isLimitReached && (
        <span className={styles.count}>{remainingUsage}</span>
      )}

      {/* 错误提示 */}
      {error && <span className={styles.error}>{error}</span>}
    </button>
  )
}
