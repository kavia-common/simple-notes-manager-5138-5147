import { Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { NoteListComponent } from '../../components/note-list/note-list.component';
import { NoteEditorComponent, NoteDraft } from '../../components/note-editor/note-editor.component';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TopbarComponent, SidebarComponent, NoteListComponent, NoteEditorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnDestroy {
  private subs = new Subscription();

  // Switch to getters to avoid referencing injected service before it's assigned
  get notes$() {
    return this.notesService.notes$;
  }
  get tags$() {
    return this.notesService.tags$;
  }

  search$ = new BehaviorSubject<string>('');
  selectedTag$ = new BehaviorSubject<string | null>(null);

  filtered$ = combineLatest([this.notes$, this.search$, this.selectedTag$]).pipe(
    map(([notes, q, tag]) => this.filterNotes(notes, q, tag))
  );

  selectedId: string | null = null;
  selectedNote: Note | null = null;
  private doc!: Document;

  private isBrowser: boolean;
  private notesService: NotesService;

  constructor(
    notesService: NotesService,
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) doc: Document
  ) {
    this.notesService = notesService;
    this.isBrowser = isPlatformBrowser(platformId);
    this.doc = doc;

    this.subs.add(
      this.notes$.subscribe(() => {
        // keep selected note reference up to date or clear if deleted
        this.selectedNote = this.selectedId
          ? this.notesService.getById(this.selectedId) ?? null
          : null;
        if (!this.selectedNote) this.selectedId = null;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private filterNotes(notes: Note[], q: string, tag: string | null): Note[] {
    const query = (q || '').trim().toLowerCase();
    const t = (tag || '').trim().toLowerCase();
    let out = notes;
    if (t) {
      out = out.filter((n) => n.tags.some((x) => x.toLowerCase() === t));
    }
    if (query) {
      out = out.filter((n) => {
        const inTitle = n.title.toLowerCase().includes(query);
        const inContent = n.content.toLowerCase().includes(query);
        const inTags = n.tags.some((x) => x.toLowerCase().includes(query));
        return inTitle || inContent || inTags;
      });
    }
    return out;
  }

  // PUBLIC_INTERFACE
  /** Handler from Topbar: update search term. */
  onSearch(q: string): void {
    this.search$.next(q);
  }

  // PUBLIC_INTERFACE
  /** Handler from Sidebar: change tag filter. */
  onTagChange(tag: string | null): void {
    this.selectedTag$.next(tag);
  }

  // PUBLIC_INTERFACE
  /** Handler from NoteList: select note for editing. */
  onSelectNote(id: string): void {
    this.selectedId = id;
    this.selectedNote = this.notesService.getById(id) ?? null;
    // Scroll editor into view on mobile (browser only)
    if (this.isBrowser) {
      globalThis.setTimeout(() => {
        const el = this.doc.querySelector('#editor') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }

  // PUBLIC_INTERFACE
  /** Handler from NoteList or Editor: delete a note. */
  onDeleteNote(id: string): void {
    this.notesService.delete(id);
    if (this.selectedId === id) {
      this.selectedId = null;
      this.selectedNote = null;
    }
  }

  // PUBLIC_INTERFACE
  /** Handler from Topbar: create a new note (opens clean editor). */
  onCreateNote(): void {
    this.selectedId = null;
    this.selectedNote = null;
    if (this.isBrowser) {
      globalThis.setTimeout(() => {
        const el = this.doc.querySelector('#editor-title') as HTMLInputElement | null;
        el?.focus();
      }, 0);
    }
  }

  // PUBLIC_INTERFACE
  /** Handler from Editor: save note (create or update). */
  onSaveDraft(draft: NoteDraft): void {
    if (draft.id) {
      const updated = this.notesService.update(draft.id, {
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        pinned: draft.pinned,
      });
      if (updated) {
        this.selectedId = updated.id;
        this.selectedNote = updated;
      }
    } else {
      const created = this.notesService.create({
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        pinned: draft.pinned,
      });
      this.selectedId = created.id;
      this.selectedNote = created;
    }
  }
}
