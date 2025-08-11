import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css',
})
export class NoteListComponent {
  @Input() notes: Note[] = [];
  @Input() selectedId: string | null = null;

  @Output() select = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  // PUBLIC_INTERFACE
  /** Emits selection of a note id. */
  onSelect(id: string): void {
    this.select.emit(id);
  }

  // PUBLIC_INTERFACE
  /** Emits deletion for a given note id. */
  onDelete(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(id);
  }

  preview(content: string): string {
    const text = content.replace(/\s+/g, ' ').trim();
    return text.length > 140 ? text.slice(0, 140) + '…' : text;
  }

  fmtDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString();
  }
}
