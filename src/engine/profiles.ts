/**
 * Fabric profiles: how much the fabric pulls in and how much support the
 * stitches need. They adjust pull compensation, underlay and satin density.
 */

export type FabricProfileId = "jersey" | "woven" | "canvas";

export interface FabricProfile {
  id: FabricProfileId;
  /** Extra length at both ends of fill rows and satin stitches (mm). */
  pullComp: number;
  /** Row spacing of the fill underlay (mm); smaller = more support. */
  underlaySpacing: number;
  /** Additionally walk around every area before filling it. */
  edgeWalk: boolean;
  /** Distance between satin zigzags (mm). */
  satinSpacing: number;
}

export const FABRIC_PROFILES: Record<FabricProfileId, FabricProfile> = {
  // Knits stretch and curl: more pull compensation, more underlay.
  jersey: { id: "jersey", pullComp: 0.35, underlaySpacing: 1.2, edgeWalk: true, satinSpacing: 0.32 },
  woven: { id: "woven", pullComp: 0.25, underlaySpacing: 1.8, edgeWalk: false, satinSpacing: 0.28 },
  canvas: { id: "canvas", pullComp: 0.15, underlaySpacing: 2.5, edgeWalk: false, satinSpacing: 0.26 },
};

export const DEFAULT_FABRIC: FabricProfileId = "jersey";
