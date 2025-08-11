import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/note.model';

export interface NoteDraft {
  id?: string | null;
  title: string;
  content: string;
  tags: string[];
  pinned?: boolean;
}

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css',
})
export class NoteEditorComponent implements OnChanges {
  @Input() note: Note | null = null;

  @Output() save = new EventEmitter<NoteDraft>();
  @Output() delete = new EventEmitter<string>();

  title = '';
  content = '';
  tagsInput = '';
  pinned = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note']) {
      const n = this.note;
      if (n) {
        this.title = n.title ?? '';
        this.content = n.content ?? '';
        this.tagsInput = (n.tags ?? []).join(', ');
        this.pinned = !!n.pinned;
      } else {
        this.reset();
      }
    }
  }

  private parseTags(): string[] {
    return this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // PUBLIC_INTERFACE
  /** Emits a save event with the current draft (create if no id, otherwise update). */
  onSave(): void {
    const payload: NoteDraft = {
      id: this.note?.id ?? null,
      title: this.title,
      content: this.content,
      tags: this.parseTags(),
      pinned: this.pinned,
    };
    this.save.emit(payload);
  }

  // PUBLIC_INTERFACE
  /** Emits a delete event (only if editing an existing note). */
  onDelete(): void {
    if (this.note?.id) {
      this.delete.emit(this.note.id);
    }
  }

  // PUBLIC_INTERFACE
  /** Clears the editor to a new note state. */
  newNote(): void {
    this.note = null;
    this.reset();
  }

  private reset(): void {
    this.title = '';
    this.content = '';
    this.tagsInput = '';
    this.pinned = false;
  }
}
