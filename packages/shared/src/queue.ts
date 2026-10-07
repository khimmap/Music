/**
 * Playback queue contracts shared between the Ember web client and server.
 *
 * Skeleton only — playback state and sync details are added later.
 */

/** A single track queued for the room, backed by a YouTube video. */
export interface QueueItem {
  /** Unique id for this queue entry. */
  id: string;
  /** YouTube video id used by the IFrame Player API. */
  youtubeVideoId: string;
  /** Track title shown in the queue. */
  title: string;
  /** Total duration in seconds. */
  durationSeconds: number;
  /** Member id of whoever added the track. */
  addedBy: string;
  /** Epoch milliseconds when the track was queued. */
  addedAt: number;
}
