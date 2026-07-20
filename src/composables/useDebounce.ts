import { onBeforeUnmount } from 'vue'

export function useDebounceFn<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return debounced
}
