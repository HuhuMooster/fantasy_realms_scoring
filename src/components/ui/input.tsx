import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, IInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <fieldset className="fieldset">
        {label && <label className="fieldset-label">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'input input-xs sm:input-md w-full',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {error && <p className="fieldset-label text-error">{error}</p>}
      </fieldset>
    )
  }
)

Input.displayName = 'Input'
