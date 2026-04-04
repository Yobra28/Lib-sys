import { Injectable, computed, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'library-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Current UI theme */
  readonly theme = signal<AppTheme>('light');

  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.hydrate();
  }

  /** Read storage / system preference and apply to <html> */
  hydrate(): void {
    if (typeof document === 'undefined') return;

    let next: AppTheme = 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (stored === 'dark' || stored === 'light') {
        next = stored;
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        next = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {
      /* private mode etc. */
    }

    this.theme.set(next);
    this.applyDom(next);
  }

  setTheme(mode: AppTheme): void {
    this.theme.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    this.applyDom(mode);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyDom(mode: AppTheme): void {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
  }
}
