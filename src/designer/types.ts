/**
 * Design element model. All sizes and positions are in millimetres;
 * (0,0) is the hoop centre, y points down.
 */

import type { Pt } from "../engine/geometry";

export type StitchMode = "fill" | "fill-outline" | "fill-satin" | "satin" | "outline" | "applique";
export type ShapeKind = "circle" | "rect" | "heart" | "star" | "diamond";

export interface BaseElement {
  id: string;
  /** Centre of the element in mm (0,0 = hoop centre). */
  x: number;
  y: number;
  /** Thread colour as #rrggbb. */
  color: string;
  mode: StitchMode;
  /** Fill row direction in degrees. */
  angle: number;
  /** Fill row spacing in mm (smaller = denser). */
  density: number;
  /** Sew a light underlay below fills for better coverage. */
  underlay: boolean;
  /** Width of the satin border in mode "fill-satin" (mm). */
  borderWidth?: number;
  /** Rotation around the element centre in degrees (clockwise). */
  rotation?: number;
}

export type TextAlign = "left" | "center" | "right";
export type TextArc = "none" | "top" | "bottom";

export interface TextElement extends BaseElement {
  kind: "text";
  text: string;
  fontId: string;
  /** Height of capital letters in mm. */
  height: number;
  /** Extra space between letters in mm (can be negative). */
  letterSpacing: number;
  /** Line distance as a factor of the letter height. */
  lineSpacing: number;
  /** Alignment of multi-line text. */
  align?: TextAlign;
  /** Text along a circle: "top" bows upwards, "bottom" like a smile. */
  arc?: TextArc;
  /** Radius of the arc in mm. */
  arcRadius?: number;
  /** Border around the letters in a second colour ("border") or a drop shadow. */
  outlineStyle?: "none" | "border" | "shadow";
  /** Width of the border / offset of the shadow in mm. */
  outlineWidth?: number;
  outlineColor?: string;
}

export type MonogramFrame = "none" | "circle" | "diamond" | "rect";

export interface MonogramElement extends BaseElement {
  kind: "monogram";
  /** Two or three initials, e.g. "KMH" – the middle one becomes the big one. */
  letters: string;
  fontId: string;
  /** Height of the (middle) letter in mm. */
  height: number;
  style: "classic" | "equal";
  letterSpacing: number;
  frame: MonogramFrame;
  frameColor: string;
  /** Width of the satin frame in mm. */
  frameWidth: number;
  /** Gap between letters and frame in mm. */
  frameGap: number;
}

export interface ShapeElement extends BaseElement {
  kind: "shape";
  shape: ShapeKind;
  width: number;
  height: number;
}

/** One filled area of an imported SVG, in source units centred on (0,0). */
export interface SvgPart {
  color: string;
  fillRule: "nonzero" | "evenodd";
  rings: Pt[][];
}

export interface SvgElement extends BaseElement {
  kind: "svg";
  name: string;
  parts: SvgPart[];
  /** Size of the source artwork (same units as the rings). */
  sourceWidth: number;
  sourceHeight: number;
  /** Target width in mm; height follows the aspect ratio. */
  width: number;
  /** true: every part uses `color`; false: the colours from the file. */
  singleColor: boolean;
}

export type DesignElement = TextElement | ShapeElement | SvgElement | MonogramElement;
