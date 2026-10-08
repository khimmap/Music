/**
 * Playback queue contracts shared between the Ember web client and server.
 */
import type { Palette } from './palette';

/** A single track queued for the room, backed by a YouTube video. */
export interface QueueItem {
  /** Unique id for this queue entry. */
  id: string;
  /** YouTube video id used by the IFrame Player API. */
  youtubeVideoId: string;
  /** Track title shown in the queue. */
  title: string;
  /** Track author / channel ("artist"). */
  artist: string;
  /** Total duration in seconds (0 if unknown). */
  durationSeconds: number;
  /** Member id (or display name) of whoever added the track. */
  addedBy: string;
  /** Epoch milliseconds when the track was queued. */
  addedAt: number;
  /** Colors extracted from the track thumbnail (server-side). */
  palette: Palette;
}
