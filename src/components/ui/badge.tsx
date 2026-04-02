import { cn } from '@/lib/utils'

interface IBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}: IBadgeProps) {
  const variantClass = {
    default: 'badge-neutral',
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    ghost: 'badge-ghost',
    outline: 'badge-outline',
  }[variant]

  const sizeClass = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  }[size]

  return (
    <span className={cn('badge', variantClass, sizeClass, className)}>{children}</span>
  )
}
