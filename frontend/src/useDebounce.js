import { useState, useEffect } from 'react';

/**
 * Debounce a rapidly changing value.
 * @param {*} value Input value
 * @param {number} delay Delay in milliseconds
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
