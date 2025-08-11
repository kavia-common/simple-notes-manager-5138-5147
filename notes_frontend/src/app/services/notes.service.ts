import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { Note } from '../models/note.model';

/**
 * NotesService
 * State management and persistence for notes (LocalStorage).
 * Exposes reactive streams for notes and tags, and provides CRUD operations.
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private storage!: StorageService;
  private readonly STORAGE_KEY = 'notes';
  private readonly notesSubject = new BehaviorSubject<Note[]>([]);
  /** Reactive stream of all notes, newest updated first. */
  readonly notes$: Observable<Note[]> = this.notesSubject.asObservable();

  /** Reactive stream of aggregated unique tags */
  readonly tags$: Observable<string[]> = this.notes$.pipe(
    map((notes) => {
      const set = new Set<string>();
      notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    })
  );

  constructor(storage: StorageService) {
    this.storage = storage;
    const loaded = this.storage.get<Note[]>(this.STORAGE_KEY, []);
    if (!loaded || loaded.length === 0) {
      // Seed with a starter note to help users understand the UI.
      const seed: Note = {
        id: this.generateId(),
        title: 'Welcome to Simple Notes',
        content:
          'This is your first note. Use the New button to create, click a note to edit, and the search bar to filter.\n\nTips:\n- Add tags with a comma, e.g., "work, ideas"\n- Your notes are saved automatically in your browser.',
        tags: ['welcome', 'tips'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: true,
      };
      this.notesSubject.next([seed]);
      this.persist();
    } else {
      // ensure sorting by updatedAt desc
      const sorted = [...loaded].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      this.notesSubject.next(sorted);
    }
  }

  // PUBLIC_INTERFACE
  /** Returns the current snapshot of notes. */
  getSnapshot(): Note[] {
    return this.notesSubject.getValue();
  }

  // PUBLIC_INTERFACE
  /** Observable of all notes. */
  list(): Observable<Note[]> {
    return this.notes$;
  }

  // PUBLIC_INTERFACE
  /** Returns a single note by id, or undefined if not found. */
  getById(id: string): Note | undefined {
    return this.getSnapshot().find((n) => n.id === id);
  }

  // PUBLIC_INTERFACE
  /**
   * Creates a new note.
   * @param data Partial info for a new note (title, content, tags).
   * @returns The created Note.
   */
  create(data: Partial<Note>): Note {
    const now = new Date().toISOString();
    const note: Note = {
      id: this.generateId(),
      title: (data.title ?? '').trim() || 'Untitled',
      content: (data.content ?? '').trim(),
      tags: (data.tags ?? []).map((t) => t.trim()).filter(Boolean),
      pinned: data.pinned ?? false,
      color: data.color,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [note, ...this.getSnapshot()];
    this.notesSubject.next(this.sort(updated));
    this.persist();
    return note;
  }

  // PUBLIC_INTERFACE
  /**
   * Updates a note by id with provided changes.
   * @param id Note id.
   * @param changes Fields to update (title, content, tags, etc).
   * @returns The updated note or undefined if not found.
   */
  update(id: string, changes: Partial<Note>): Note | undefined {
    const list = this.getSnapshot();
    let updatedNote: Note | undefined;
    const updatedList = list.map((n) => {
      if (n.id === id) {
        updatedNote = {
          ...n,
          ...changes,
          title: changes.title !== undefined ? (changes.title ?? '').trim() : n.title,
          content:
            changes.content !== undefined ? (changes.content ?? '').trim() : n.content,
          tags:
            changes.tags !== undefined
              ? (changes.tags ?? []).map((t) => t.trim()).filter(Boolean)
              : n.tags,
          updatedAt: new Date().toISOString(),
        };
        return updatedNote;
      }
      return n;
    });
    if (updatedNote) {
      this.notesSubject.next(this.sort(updatedList));
      this.persist();
    }
    return updatedNote;
  }

  // PUBLIC_INTERFACE
  /**
   * Deletes a note by id.
   * @param id Note id.
   */
  delete(id: string): void {
    const updated = this.getSnapshot().filter((n) => n.id !== id);
    this.notesSubject.next(this.sort(updated));
    this.persist();
  }

  // PUBLIC_INTERFACE
  /**
   * Filters notes client-side by a search term and optional tag.
   * Search matches title, content, or tags (case-insensitive).
   */
  filter(search: string, tag?: string | null): Observable<Note[]> {
    const q = (search || '').trim().toLowerCase();
    const t = (tag || '').trim().toLowerCase();
    return this.notes$.pipe(
      map((notes) => {
        let out = notes;
        if (t) {
          out = out.filter((n) => n.tags.some((x) => x.toLowerCase() === t));
        }
        if (q) {
          out = out.filter((n) => {
            const inTitle = n.title.toLowerCase().includes(q);
            const inContent = n.content.toLowerCase().includes(q);
            const inTags = n.tags.some((x) => x.toLowerCase().includes(q));
            return inTitle || inContent || inTags;
          });
        }
        return out;
      })
    );
  }

  private persist(): void {
    this.storage.set<Note[]>(this.STORAGE_KEY, this.getSnapshot());
  }

  private sort(list: Note[]): Note[] {
    // Pinned notes first, then by updatedAt desc
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  private generateId(): string {
    // Simple unique id (time-base + random)
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
