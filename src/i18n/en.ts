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


  "edit.fontFrom": "from {n} mm",
  "edit.fontMinHeight": "This font sews cleanly from about {n} mm height. Make the text larger or choose “Outline only”.",
  "font.cat.bold": "Bold",
  "font.cat.rounded": "Rounded",
  "font.cat.condensed": "Condensed",
  "font.cat.serif": "Serif",
  "font.cat.script": "Script",
  "font.cat.hand": "Handwriting",
  "font.cat.display": "Display & college",
  "font.cat.custom": "Your fonts",
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
  "edit.color": "Thread colour",

  "mode.fill": "Fill",
  "mode.fill-outline": "Fill with outline",
  "mode.outline": "Outline only (bean stitch)",

  "mode.fill-satin": "Fill with satin border",
  "mode.satin": "Satin (lettering, narrow shapes)",
  "edit.satinSpacing": "Satin spacing (mm)",
  "edit.borderWidth": "Border width (mm)",
  "edit.satinHint":
    "Satin has a lovely sheen and suits lettering and narrow shapes up to 7 mm wide. Stichwerk fills wider parts automatically.",

  "fabricProfile.title": "Fabric",
  "fabricProfile.jersey": "T-shirt / jersey (stretchy)",
  "fabricProfile.woven": "Cotton / woven fabric",
  "fabricProfile.canvas": "Denim / canvas (firm)",
  "fabricProfile.hint.jersey":
    "Use cut-away stabilizer and do not stretch the fabric when hooping. Stichwerk adds more pull compensation and underlay.",
  "fabricProfile.hint.woven": "Tear-away stabilizer is usually enough.",
  "fabricProfile.hint.canvas":
    "Firm fabric hardly pulls in, tear-away stabilizer is enough. Stichwerk uses less pull compensation.",

  "threads.range": "Thread range",
  "threads.mine": "My threads ({n})",
  "threads.search": "No. / name",
  "threads.addMine": "☆ Add to my threads",
  "threads.inMine": "★ In my threads",
  "threads.mineEmpty": "No threads of your own yet. Pick your range above, search for the number on your spool and mark it with the star. Then this list only shows threads you really own.",
  "threads.noResults": "No colour found.",

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
  "preview.outside": "The design extends beyond the hoop ({w} × {h} mm).",

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
  "machine.unsupported":
    "This browser cannot use Bluetooth. Open Stichwerk on a PC in Chrome or Edge. PES export still works here.",
  "machine.intro":
    "Once beforehand: pair the PP1 in the Windows Bluetooth settings (long-press the Bluetooth button on the machine).",
  "machine.connect": "Connect to PP1",
  "machine.connecting": "Connecting …",
  "machine.disconnect": "Disconnect",
  "machine.connected": "Connected: {model}",
  "machine.status": "Status: {status}",
  "machine.upload": "Send design to machine",
  "machine.uploading": "Sending design … {n} %",
  "machine.uploadEmpty": "Create a design first.",
  "machine.uploadOutside": "The design does not fit the hoop. Make it smaller or move it.",
  "machine.changedSinceUpload":
    "You changed the design after sending it. Delete the pattern on the machine and send it again to sew your changes.",
  "machine.onMachine": "On the machine: {n} stitches",
  "machine.maskTrace": "Start mask trace",
  "machine.maskTraceHint": "The machine traces the outline without sewing to check that everything fits the hoop.",
  "machine.maskTraceWait": "Press the accept button on the machine to trace the outline.",
  "machine.maskTracing": "The machine is tracing the outline …",
  "machine.startSewing": "Prepare sewing",
  "machine.startSewingHint": "Then press the start/stop button on the machine.",
  "machine.resume": "Continue sewing",
  "machine.sewing": "Sewing … stitch {cur} of {total}",
  "machine.colorChange": "Colour change: thread {color} and press start/stop on the machine.",
  "machine.paused": "Paused at stitch {cur} of {total}",
  "machine.progressAt": "Stitch {cur} of {total}",
  "machine.step": "Adjust stitch position",
  "machine.complete": "Finished!",
  "machine.delete": "Delete pattern on the machine",
  "machine.currentColor": "Current colour",
  "machine.solutions": "How to fix it:",

  "machine.err.pairing":
    "The machine is not paired with this PC yet. Hold the Bluetooth button on the PP1 and pair it in the Windows Bluetooth settings. Then connect again.",
  "machine.err.connect": "Connection failed: {detail}",
  "machine.err.disconnected": "The connection to the machine was lost.",
  "machine.err.upload": "Sending failed: {detail}",
  "machine.err.command": "The machine did not accept the command: {detail}",

  "status.0": "Starting",
  "status.1": "Bobbin thread",
  "status.16": "Ready",
  "status.17": "Ready to sew",
  "status.18": "Receiving data",
  "status.32": "Waiting for mask trace",
  "status.33": "Mask trace running",
  "status.34": "Mask trace done",
  "status.48": "Sewing",
  "status.49": "Finished",
  "status.50": "Interrupted",
  "status.64": "Waiting for colour change",
  "status.65": "Paused",
  "status.66": "Stopped",
  "status.80": "Hoop avoidance",
  "status.81": "Moving hoop aside",
  "status.96": "Receiving",
  "status.97": "Received",
  "status.221": "Unknown",
  "status.255": "Connecting",

  "error.svgInvalid": "This file is not a valid SVG.",
  "error.svgEmpty":
    "No filled areas were found in this SVG. Stroke-only artwork is not supported yet.",
  "error.projectInvalid": "This file is not a Stichwerk design.",
  "error.font": "This font file could not be read.",
  "error.fontLoad": "The font could not be loaded. Check your internet connection.",
  "error.generic": "Something went wrong: {msg}",

  "info.open":
    "Info & licences",
  "info.title":
    "Info & licences",
  "info.close":
    "Close",
  "info.about.title":
    "About Stichwerk",
  "info.about.text":
    "Stichwerk is an independent, non-commercial hobby project for designing embroidery patterns for the Brother PP1 (SKiTCH). It is not affiliated with Brother Industries, Ltd. or Madeira Garnfabrik.",
  "info.about.risk":
    "Use at your own risk and without warranty. Thread colours on screen approximate the real thread; the number on the spool is what counts.",
  "info.about.trademarks":
    "Brother, SKiTCH and Artspira are trademarks of Brother Industries, Ltd.; Madeira, Polyneon and Frosted Matt are trademarks of Madeira Garnfabrik. The names are used for descriptive purposes only.",
  "info.privacy.title":
    "Privacy",
  "info.privacy.local":
    "Stichwerk collects no personal data. There is no account, no analytics, no tracking and no cookies. Designs, settings and your thread list are stored only in your own browser and never leave your computer. You can delete them at any time in your browser settings.",
  "info.privacy.bluetooth":
    "The connection to the embroidery machine runs directly via Bluetooth between your computer and the machine. No data is sent to third parties. Fonts are loaded from this site itself, not from Google.",
  "info.privacy.hosting":
    "This site is served by GitHub Pages (GitHub Inc.). When you open it, GitHub processes technically necessary data such as your IP address to deliver and secure the site. Details:",
  "info.privacy.githubLink":
    "GitHub privacy statement",
  "info.licence.title":
    "Licence and source code",
  "info.licence.text":
    "Stichwerk is free software under the GNU General Public License v3.0 or later. The complete source code is at",
  "info.licence.respira":
    "Machine protocol, PEN format and Brother colours from Respira by jhbruhn (Apache License 2.0)",
  "info.licence.pyembroidery":
    "PES export based on pyembroidery by Tatarize (MIT License)",
  "info.licence.inkstitch":
    "Madeira colour values from the Ink/Stitch palettes (GNU GPL v3.0)",
  "info.licence.fonts":
    "30 fonts from Google Fonts under the SIL Open Font License or Apache License 2.0, free to use even for embroidery you sell. Overview:",
  "info.imprint.title":
    "Disclosure under § 25 Austrian Media Act",
  "info.imprint.owner":
    "Media owner",
  "info.imprint.purpose":
    "Basic purpose: private, non-commercial website offering a tool for designing embroidery patterns.",

  "footer.credits":
    "Stichwerk is free software (GPL-3.0) and an independent project, not affiliated with Brother or Madeira.",
};
