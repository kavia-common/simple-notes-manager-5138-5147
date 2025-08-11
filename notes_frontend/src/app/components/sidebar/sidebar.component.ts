import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() tags: string[] = [];
  @Input() selectedTag: string | null = null;

  @Output() tagChange = new EventEmitter<string | null>();

  // PUBLIC_INTERFACE
  /** Emits the selected tag (or null for all) */
  selectTag(tag: string | null): void {
    this.tagChange.emit(tag);
  }
}
