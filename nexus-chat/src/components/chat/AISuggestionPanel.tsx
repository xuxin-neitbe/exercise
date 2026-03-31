/**
 * AI 建议面板组件
 *
 * 显示 AI 生成的建议列表
 * 状态由父组件 ChatArea 通过 props 传递
 */

'use client'

import React, { useEffect, useRef } from 'react'

import type { AISuggestion } from '@/types/ai'

import styles from './AISuggestionPanel.module.css'

interface AISuggestionPanelProps {
  isOpen: boolean
  onClose: () => void
  onUseSuggestion?: (suggestion: AISuggestion) => void
  // 从父组件接收状态
  suggestions: AISuggestion[]
  isLoading: boolean
  error: string | null
  selectedSuggestion: AISuggestion | null
  onSelectSuggestion: (suggestion: AISuggestion) => void
  onFeedback: (id: string, type: 'positive' | 'negative') => void
  onRetry: () => void
}

/**
 * AI 建议面板组件
 */
export function AISuggestionPanel({
  isOpen,
  onClose,
  onUseSuggestion,
  suggestions,
  isLoading,
  error,
  selectedSuggestion,
  onSelectSuggestion,
  onFeedback,
  onRetry,
}: AISuggestionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 处理使用建议
  const handleUseSuggestion = () => {
    if (selectedSuggestion && onUseSuggestion) {
      onUseSuggestion(selectedSuggestion)
    }
  }

  // 处理重试
  const handleRetry = () => {
    onRetry()
  }

  // 不渲染关闭状态
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-suggestion-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className={styles.header}>
          <h2 id="ai-suggestion-title" className={styles.title}>
            AI 建议回复
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className={styles.content}>
          {/* 加载状态 */}
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>正在生成建议...</p>
            </div>
          )}

          {/* 加载骨架屏 */}
          {isLoading && (
            <div className={styles.skeletons}>
              {[1, 2, 3].map((i) => (
                <div key={i} data-testid="skeleton" className={styles.skeleton} />
              ))}
            </div>
          )}

          {/* 错误状态 */}
          {error && !isLoading && (
            <div className={styles.error}>
              <p>{error}</p>
              <button className={styles.retryButton} onClick={handleRetry}>
                重试
              </button>
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className={styles.empty}>
              <p>暂无建议</p>
            </div>
          )}

          {/* 建议列表 */}
          {!isLoading && !error && suggestions.length > 0 && (
            <ul className={styles.list} role="listbox">
              {suggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  isSelected={selectedSuggestion?.id === suggestion.id}
                  onSelect={onSelectSuggestion}
                  onFeedback={onFeedback}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 底部操作 */}
        {selectedSuggestion && (
          <div className={styles.footer}>
            <button className={styles.useButton} onClick={handleUseSuggestion}>
              使用此建议
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 建议项组件
 */
function SuggestionItem({
  suggestion,
  isSelected,
  onSelect,
  onFeedback,
}: {
  suggestion: AISuggestion
  isSelected: boolean
  onSelect: (suggestion: AISuggestion) => void
  onFeedback: (id: string, type: 'positive' | 'negative') => void
}) {
  const [showThanks, setShowThanks] = React.useState(false)

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reply':
        return '回复'
      case 'question':
        return '问题'
      case 'topic':
        return '话题'
      default:
        return type
    }
  }

  // 处理反馈
  const handleFeedback = (type: 'positive' | 'negative') => {
    onFeedback(suggestion.id, type)
    setShowThanks(true)
    setTimeout(() => setShowThanks(false), 2000)
  }

  return (
    <li
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(suggestion)}
    >
      {/* 建议内容 */}
      <div className={styles.itemContent}>
        <span className={styles.itemText}>{suggestion.content}</span>
      </div>

      {/* 元信息 */}
      <div className={styles.itemMeta}>
        <span className={styles.typeTag}>{getTypeLabel(suggestion.type)}</span>
        <span className={styles.confidence}>{Math.round(suggestion.confidence * 100)}%</span>
      </div>

      {/* 反馈按钮 */}
      <div className={styles.itemActions}>
        {showThanks ? (
          <span className={styles.thanks}>感谢反馈</span>
        ) : (
          <>
            <button
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation()
                handleFeedback('positive')
              }}
              aria-label="点赞"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>
            <button
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation()
                handleFeedback('negative')
              }}
              aria-label="点踩"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
            </button>
          </>
        )}
      </div>
    </li>
  )
}
