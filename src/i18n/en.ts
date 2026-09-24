import type { TranslationKey } from "./de";

/** English texts. Placeholders in {braces} are replaced. */
export const en: Record<TranslationKey, string> = {
  "app.tagline": "Embroidery designs for the Brother PP1",
  "lang.switch": "Change language",

  "toolbar.new": "New",
  "toolbar.open": "Open",
  "toolbar.save": "Save",
  "toolbar.importSvg": "Import SVG",
  "toolbar.exportPes": "Export PES",
  "toolbar.confirmNew": "Discard the current design and start over?",

  "elements.title": "Elements",
  "elements.addText": "+ Text",
  "elements.addShape": "+ Shape",
  "elements.empty": "Nothing here yet. Start with some text, a shape or import an SVG logo.",
  "elements.orderHint":
    "Elements are sewn from top to bottom. Keeping same-coloured elements together saves thread changes.",
  "elements.earlier": "Sew earlier",
  "elements.later": "Sew later",
  "elements.delete": "Delete",

  "label.text": "Text: {text}",
  "label.emptyText": "(empty)",
  "label.svg": "Logo: {name}",

  "shape.heart": "Heart",
  "shape.circle": "Circle / oval",
  "shape.rect": "Rectangle",
  "shape.star": "Star",

  "font.style.bold": "bold",
  "font.style.rounded": "rounded",
  "font.style.serif": "serif",
  "font.style.script": "script",

  "edit.text": "Text (Enter for a new line)",
  "edit.font": "Font",
  "edit.fontUpload": "Load your own font (TTF/OTF/WOFF) …",
  "edit.letterHeight": "Height (mm)",
  "edit.letterSpacing": "Spacing (mm)",
  "edit.lineSpacing": "Line spacing",
  "edit.shape": "Shape",
  "edit.width": "Width (mm)",
  "edit.height": "Height (mm)",
  "edit.posX": "Position left/right (mm)",
  "edit.posY": "Position up/down (mm)",
  "edit.mode": "Stitch type",
  "edit.angle": "Stitch angle (°)",
  "edit.density": "Row spacing (mm)",
  "edit.underlay": "Underlay",
  "edit.color": "Thread colour (Brother)",
  "edit.smallText":
    "Fills get lumpy on letters smaller than 7 mm. “Outline only” or a larger height will sew more cleanly.",

  "mode.fill": "Fill",
  "mode.fill-outline": "Fill with outline",
  "mode.outline": "Outline only (bean stitch)",

  "svg.colors": "Colours",
  "svg.fileColors": "Colours from the file",
  "svg.singleColor": "One colour for everything",
  "svg.replaceColor": "Click a colour to change it",

  "preview.fabric": "Fabric colour",
  "preview.jumps": "Show jump threads",
  "preview.zoomIn": "Zoom in",
  "preview.zoomOut": "Zoom out",
  "preview.fit": "Show whole hoop",
  "preview.empty": "Your embroidery design appears here.",
  "preview.outside": "The design extends beyond the hoop (100 × 100 mm).",

  "fabric.white": "White",
  "fabric.grey": "Heather grey",
  "fabric.black": "Black",
  "fabric.navy": "Navy",
  "fabric.red": "Red",
  "fabric.green": "Forest green",
  "fabric.pink": "Pink",

  "stats.stitches": "{n} stitches",
  "stats.colors": "{n} colours",
  "stats.color": "1 colour",
  "stats.size": "{w} × {h} mm",
  "stats.time": "approx. {n} min",

  "sequence.title": "Colour sequence",

  "machine.title": "Machine",
  "machine.soon":
    "The direct connection to the PP1 arrives with the next version. Until then: use “Export PES” and open the file in Respira to sew it.",

  "error.svgInvalid": "This file is not a valid SVG.",
  "error.svgEmpty":
    "No filled areas were found in this SVG. Stroke-only artwork is not supported yet.",
  "error.projectInvalid": "This file is not a Stichwerk design.",
  "error.font": "This font file could not be read.",
  "error.fontLoad": "The font could not be loaded. Check your internet connection.",
  "error.generic": "Something went wrong: {msg}",

  "footer.credits":
    "Fonts under the SIL Open Font License. PES export based on pyembroidery (MIT). Machine protocol based on Respira (Apache-2.0).",
};
