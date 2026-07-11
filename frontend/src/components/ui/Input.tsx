import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border border-secondary-300 bg-white text-text-primary placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-100 dark:placeholder:text-secondary-500',
            error && 'border-danger-500 focus:ring-danger-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
