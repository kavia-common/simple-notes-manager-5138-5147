import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * StorageService
 * A thin wrapper around browser localStorage with JSON serialization,
 * reserved for persisting application data like notes.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'notes_app__';
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // PUBLIC_INTERFACE
  /**
   * Stores a value under the given key.
   * @param key Storage key, will be namespaced internally.
   * @param value Any serializable value.
   */
  set<T>(key: string, value: T): void {
    if (!this.isBrowser) return;
    try {
      const namespaced = this.ns(key);
      const serialized = JSON.stringify(value);
      globalThis.localStorage?.setItem(namespaced, serialized);
    } catch (err) {
      // Fail silently to avoid breaking UI if storage quota or privacy mode blocks
      console.warn('StorageService.set failed', err);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Retrieves a value stored under the given key or returns the provided fallback.
   * @param key Storage key.
   * @param fallback Value to return if no item exists or parsing fails.
   */
  get<T>(key: string, fallback: T): T {
    if (!this.isBrowser) return fallback;
    try {
      const namespaced = this.ns(key);
      const raw = globalThis.localStorage?.getItem(namespaced);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn('StorageService.get failed', err);
      return fallback;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Removes a stored value by key.
   * @param key Storage key.
   */
  remove(key: string): void {
    if (!this.isBrowser) return;
    try {
      const namespaced = this.ns(key);
      globalThis.localStorage?.removeItem(namespaced);
    } catch (err) {
      console.warn('StorageService.remove failed', err);
    }
  }

  private ns(key: string): string {
    return `${this.prefix}${key}`;
  }
}
