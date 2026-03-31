import styles from './Avatar.module.css'

interface AvatarProps {
    src?: string | null
    name?: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
    const initials = getInitials(name)

    return (
        <div className={`${styles.avatar} ${styles[size]} ${className}`}>
            {src ? (
                <img src={src} alt={name || 'Avatar'} className={styles.image} />
            ) : (
                <span className={styles.initials}>{initials}</span>
            )}
        </div>
    )
}

function getInitials(name: string | null | undefined): string {
    if (!name) return '?'

    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }

    return name.slice(0, 2).toUpperCase()
}
