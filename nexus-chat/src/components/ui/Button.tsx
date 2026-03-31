import type { ButtonHTMLAttributes} from 'react';
import { forwardRef } from 'react'

import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        children,
        variant = 'primary',
        size = 'md',
        loading = false,
        fullWidth = false,
        disabled,
        className = '',
        ...props
    }, ref) => {
        const classNames = [
            styles.button,
            styles[variant],
            styles[size],
            fullWidth && styles.fullWidth,
            loading && styles.loading,
            className
        ].filter(Boolean).join(' ')

        return (
            <button
                ref={ref}
                className={classNames}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <span className={styles.spinner}>
                        <svg viewBox="0 0 24 24" fill="none" className={styles.spinnerIcon}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="10" />
                        </svg>
                    </span>
                )}
                <span className={loading ? styles.hiddenText : ''}>{children}</span>
            </button>
        )
    }
)

Button.displayName = 'Button'
