/**
 * Common positions on a T-shirt with a recommended maximum size.
 * The distances in the help texts are guide values for adult shirts.
 */

export type PlacementId = "chestLeft" | "chestCenter" | "neck" | "sleeve" | "kidsChest";

export interface Placement {
  id: PlacementId;
  /** Maximum size of the design in mm (width, height). */
  w: number;
  h: number;
}

export const PLACEMENTS: Placement[] = [
  { id: "chestLeft", w: 80, h: 80 },
  { id: "chestCenter", w: 100, h: 100 },
  { id: "kidsChest", w: 70, h: 70 },
  { id: "neck", w: 70, h: 25 },
  { id: "sleeve", w: 60, h: 60 },
];
