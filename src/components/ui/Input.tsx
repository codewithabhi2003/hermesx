import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-negative"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-input px-3 text-sm text-text-primary',
            'placeholder:text-text-muted transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-ring',
            error ? 'border-negative' : 'border-border focus:border-primary',
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-negative">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-xs text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
