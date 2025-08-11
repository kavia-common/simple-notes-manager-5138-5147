export interface Note {
  /** Unique identifier for the note */
  id: string;
  /** Title of the note */
  title: string;
  /** Content of the note, supports plain text or markdown */
  content: string;
  /** ISO timestamp for creation */
  createdAt: string;
  /** ISO timestamp for last update */
  updatedAt: string;
  /** List of tags applied to the note */
  tags: string[];
  /** Optional pin flag to prioritize note visually */
  pinned?: boolean;
  /** Optional custom color */
  color?: string;
}
