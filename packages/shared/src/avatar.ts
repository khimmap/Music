/**
 * Avatar configuration contracts shared between the Ember web client and server.
 *
 * Skeleton only — describes a modular low-poly/chibi character assembled from
 * swappable parts (body, hair, outfit, accessory). Part ids reference GLBs
 * logged in apps/web/public/assets/LICENSES.md.
 */

/** Body silhouette the character is built on. */
export type BodyType = 'feminine' | 'masculine' | 'neutral';

/** Hex color choices applied to the modular parts. */
export interface AvatarColors {
  /** Skin tone. */
  skin: string;
  /** Hair color. */
  hair: string;
  /** Primary outfit color. */
  outfitPrimary: string;
  /** Secondary / accent outfit color. */
  outfitSecondary: string;
}

/** A fully described character the renderer can assemble. */
export interface AvatarConfig {
  /** Body silhouette / proportions. */
  bodyType: BodyType;
  /** Hair part id (e.g. 'hair_short_01'), or null for bald. */
  hair: string | null;
  /** Outfit part id (e.g. 'outfit_hoodie_01'). */
  outfit: string;
  /** Optional accessory part id (e.g. 'glasses_round'), or null. */
  accessory: string | null;
  /** Color choices for the parts above. */
  colors: AvatarColors;
}
