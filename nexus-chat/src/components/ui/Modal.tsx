import type { ReactNode} from 'react';
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import styles from './Modal.module.css'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
}

function ModalContent({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {title && (
                    <div className={styles.header}>
                        <h2 className={styles.title}>{title}</h2>
                        <button className={styles.closeButton} onClick={onClose}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    )
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return createPortal(
        <ModalContent isOpen={isOpen} onClose={onClose} title={title} children={children} />,
        document.body
    )
}
