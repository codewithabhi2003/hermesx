import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, required, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-negative"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            'w-full resize-none rounded-lg border bg-input px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-ring',
            error ? 'border-negative' : 'border-border focus:border-primary',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-negative">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
