import type { InputHTMLAttributes} from 'react';
import { forwardRef } from 'react'

import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
    fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, fullWidth = false, className = '', ...props }, ref) => {
        return (
            <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
                {label && <label className={styles.label}>{label}</label>}
                <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${icon ? styles.hasIcon : ''}`}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <input ref={ref} className={`${styles.input} ${className}`} {...props} />
                </div>
                {error && <span className={styles.error}>{error}</span>}
            </div>
        )
    }
)

Input.displayName = 'Input'
