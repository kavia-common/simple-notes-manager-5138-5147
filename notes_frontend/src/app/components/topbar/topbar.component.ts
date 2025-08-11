import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  query = '';

  @Output() search = new EventEmitter<string>();
  @Output() create = new EventEmitter<void>();

  // PUBLIC_INTERFACE
  /** Emits the current search query text as the user types. */
  onSearchInput(): void {
    this.search.emit(this.query);
  }

  // PUBLIC_INTERFACE
  /** Emits a request to create a new note. */
  onCreate(): void {
    this.create.emit();
  }
}
