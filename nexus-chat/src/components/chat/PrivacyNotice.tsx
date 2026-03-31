/**
 * AI 建议确认对话框组件
 *
 * 用户点击"帮我回答"时显示的确认弹窗
 * - 确定后开始生成 AI 建议
 * - 取消后不消耗使用次数
 */

'use client'

import React, { useEffect, useRef } from 'react'

import styles from './PrivacyNotice.module.css'

interface PrivacyNoticeProps {
  isOpen: boolean
  onAccept?: () => void
  onDecline?: () => void
}

/**
 * AI 建议确认对话框组件
 */
export function PrivacyNotice({ isOpen, onAccept, onDecline }: PrivacyNoticeProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // 打开时聚焦到确定按钮
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus()
    }
  }, [isOpen])

  // 不渲染关闭状态
  if (!isOpen) {
    return null
  }

  // 处理确定
  const handleConfirm = () => {
    console.log('[PrivacyNotice] handleConfirm called')
    onAccept?.()
  }

  // 处理取消
  const handleCancel = () => {
    console.log('[PrivacyNotice] handleCancel called')
    onDecline?.()
  }

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        {/* 标题 */}
        <h2 id="privacy-title" className={styles.title}>
          AI 建议功能
        </h2>

        {/* 内容 */}
        <div className={styles.content}>
          <p className={styles.confirmText}>
            是否使用 AI 帮您生成回复建议？
          </p>

          <div className={styles.section}>
            <h3>功能说明</h3>
            <ul>
              <li>
                AI 将根据当前对话上下文生成 <strong>1-3 个</strong>回复建议
              </li>
              <li>
                对话内容将发送给 AI 服务提供商进行处理
              </li>
              <li>
                每次使用将消耗 <strong>1 次</strong>使用次数（每日 20 次）
              </li>
            </ul>
          </div>

          <div className={styles.notice}>
            <p>
              点击「确定」开始生成建议，点击「取消」则不消耗使用次数
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={handleConfirm}
          >
            确定
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleCancel}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
