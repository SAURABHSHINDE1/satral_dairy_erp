/**
 * useDebounce.ts
 *
 * Generic debounce hook — delays updating the returned value until `delay` ms
 * have elapsed since the last change to `value`.
 *
 * PATTERN FOR ALL FUTURE MODULES:
 * ─────────────────────────────────────────────────────────────────────────────
 *   // 1. Import the hook
 *   import { useDebounce } from '../hooks/useDebounce';
 *
 *   // 2. Create a state for the raw filter input
 *   const [filterProduct, setFilterProduct] = useState('');
 *
 *   // 3. Create a debounced copy (300ms delay — avoids API call per keystroke)
 *   const debouncedProduct = useDebounce(filterProduct, 300);
 *
 *   // 4. Use debouncedProduct in useQuery — not the raw filterProduct
 *   const { data } = useQuery({
 *     queryKey: ['myModule', debouncedProduct],
 *     queryFn: () => myService.getAll({ product_name: debouncedProduct }),
 *   });
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * @param value  - The reactive value to debounce
 * @param delay  - Debounce delay in ms (default 300)
 * @returns The debounced value, updated only after the delay has elapsed
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel the previous timer if value or delay changes before it fires
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
