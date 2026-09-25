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

  "preview.centerDesign": "Centre design",
  "preview.hint": "Click to select, drag to move, corners resize, the circle on top rotates (Shift: 15° steps, Alt: no snapping). Arrow keys move by 1 mm, with Shift by 5 mm. Delete removes, Ctrl+D duplicates.",
  "elements.undo": "Undo (Ctrl+Z)",
  "elements.redo": "Redo (Ctrl+Y)",
  "elements.duplicate": "Duplicate (Ctrl+D)",
  "edit.rotation": "Rotation (°)",
  "edit.align": "Alignment",
  "align.left": "Left",
  "align.center": "Centre",
  "align.right": "Right",
  "edit.arc": "Line shape",
  "arc.none": "Straight",
  "arc.top": "Arc upwards",
  "arc.bottom": "Arc downwards",
  "edit.arcRadius": "Arc radius (mm)",
  "edit.centerH": "↔ Centre",
  "edit.centerV": "↕ Centre",
  "edit.centerTitle": "Move to the hoop centre",

  "stats.jumps": "{n} jumps, {cuts} with thread cut",
  "stats.thread": "Thread approx. {top} m top, {bobbin} m bobbin (estimate)",
  "sequence.detail": "{n} stitches · approx. {m} m thread",
  "sim.start": "Play sewing order",
  "sim.play": "Play",
  "sim.pause": "Pause",
  "sim.restart": "From the start",
  "sim.position": "Position in the sewing order",
  "sim.speed": "Speed",
  "sim.speed.slow": "Slow",
  "sim.speed.normal": "Normal",
  "sim.speed.fast": "Fast",
  "sim.speed.veryFast": "Very fast",
  "sim.close": "Stop",
  "sim.status": "Stitch {cur} of {total}",
  "sim.color": "Colour {n}: {name}",
  "sim.jumps": "Jumps: {n} of {total}",
  "sim.stopAtColors": "Pause at colour changes",
  "sim.colorChange": "Colour change: the machine would stop here and you would thread {name}. ▶ continues.",

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
  "info.version":
    "Version {v}",
  "info.built":
    "built on {date}",
  "info.about.ai":
    "The source code of Stichwerk was created with the help of AI and checked with automated tests, but not reviewed line by line by hand. Errors cannot be ruled out.",
  "info.about.title":
    "About Stichwerk",
  "info.about.text":
    "Stichwerk is an independent, non-commercial hobby project for designing embroidery patterns for the Brother PP1 (SKiTCH). It is not affiliated with Brother Industries, Ltd. or Madeira Garnfabrik.",
  "info.about.risk":
    "Use entirely at your own risk and without any warranty. No liability is accepted for damage to the machine, fabric or materials, faulty embroidery results or data loss. Thread colours on screen approximate the real thread; the number on the spool is what counts.",
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

  "help.button":
    "Help",
  "elements.addMonogram":
    "+ Monogram",
  "label.monogram":
    "Monogram: {letters}",
  "shape.diamond":
    "Diamond",
  "mode.applique":
    "Appliqué (sewn-on fabric)",
  "stats.title":
    "Embroidery data",
  "edit.appliqueHint":
    "The machine first sews a placement line and stops. Lay the fabric piece on it and press start. It is then tacked down and the machine stops again: trim the excess fabric close to the seam. Finally the satin border is sewn.",
  "edit.coverWidth":
    "Border width (mm)",
  "edit.outline":
    "Border around text",
  "outline.none":
    "No border",
  "outline.border":
    "Outline",
  "outline.shadow":
    "Shadow",
  "edit.outlineWidth":
    "Border width (mm)",
  "edit.shadowOffset":
    "Offset (mm)",
  "edit.outlineColor":
    "Border / shadow colour",
  "edit.monoLetters":
    "Initials",
  "edit.monoStyle":
    "Style",
  "mono.classic":
    "Classic (large middle)",
  "mono.equal":
    "Equal size",
  "edit.monoFrame":
    "Frame",
  "frame.none":
    "None",
  "frame.circle":
    "Circle",
  "frame.diamond":
    "Diamond",
  "frame.rect":
    "Rectangle",
  "edit.frameWidth":
    "Frame (mm)",
  "edit.frameGap":
    "Gap (mm)",
  "edit.frameColor":
    "Frame colour",
  "placement.title":
    "Position on the shirt",
  "placement.none":
    "No template",
  "placement.max":
    "max. {w} × {h} cm",
  "placement.fit":
    "Fit size",
  "placement.chestLeft":
    "Left chest logo",
  "placement.chestCenter":
    "Centre chest",
  "placement.kidsChest":
    "Kids' shirt chest",
  "placement.neck":
    "Back of neck",
  "placement.sleeve":
    "Sleeve",
  "placement.chestLeft.how":
    "Guide value for adults: on the left chest as seen from the front (the wearer's heart side). Centre of the design about 18–20 cm below the point where collar and shoulder seam meet, and about 9–10 cm from the centre front.",
  "placement.chestCenter.how":
    "Guide value for adults: centred on the front, top edge of the design about 7–10 cm below the collar.",
  "placement.kidsChest.how":
    "Guide value: centred on the front, top edge of the design about 5–7 cm below the collar.",
  "placement.neck.how":
    "Centred on the back, top edge of the design about 2–3 cm below the collar seam. Keep it narrow, otherwise the fabric puckers.",
  "placement.sleeve.how":
    "On the outside of the sleeve, centred on the sleeve seam, top edge about 8–10 cm below the shoulder seam. The sleeve must lie flat in the hoop without tension.",
  "note.applique.place":
    "Appliqué: now lay the fabric piece so it fully covers the sewn placement line, then press start on the machine.",
  "note.applique.trim":
    "Appliqué: do not remove the hoop! Trim the excess fabric close to the tack-down seam, then press start for the satin border.",
  "noteShort.applique.place":
    "Place fabric",
  "noteShort.applique.trim":
    "Trim fabric",
  "help.fabric":
    "Choose the fabric you embroider on. Stichwerk then adjusts pull compensation, underlay and satin density.\nStretchy jersey (T-shirts) needs more underlay and cut-away stabilizer, firm fabric less.",
  "help.placement":
    "Choose where the design goes on the shirt. “Fit size” scales the whole design to a suitable size and moves it to the hoop centre.\nBelow you see where to mark the design on the shirt. The measurements are guide values for adult shirts.",
  "help.elements":
    "Add text, shapes and monograms here. Elements are sewn from top to bottom in this list; use ↑ ↓ to change the order.\n↶ ↷ undo and redo, ⧉ duplicates the selected element.",
  "help.kind.text":
    "A piece of lettering. All settings below apply to this text only. In the preview you can move, rotate and resize it directly.",
  "help.kind.shape":
    "A basic shape such as a heart or star. As a fill, with a border or as appliqué with sewn-on fabric.",
  "help.kind.svg":
    "A logo imported from an SVG file. Each colour area becomes its own embroidery area; you can swap colours individually.",
  "help.kind.monogram":
    "Two or three initials, classically with a large middle letter, optionally framed. In a classic monogram the middle letter is usually the initial of the surname.",
  "help.text":
    "The text to embroider. Press Enter to start a new line.",
  "help.font":
    "The list shows every font with your text. “from … mm” is the smallest letter height at which the font still sews cleanly.\nAt the very bottom you can load your own font files.",
  "help.height":
    "Height of a capital letter in millimetres. Lower case letters and descenders follow from it.\n8–20 mm is typical for T-shirts.",
  "help.letterSpacing":
    "Extra space between letters in mm. A little more space (0.3–1 mm) keeps letters from running together when sewn. Leave script fonts at 0 so the letters stay connected.",
  "help.lineSpacing":
    "Distance between lines as a multiple of the letter height. 1.5 is a good start.",
  "help.arc":
    "Puts the text on a circular arc: “upwards” bends like a rainbow, “downwards” like a smile. Typical for college and club logos.",
  "help.align":
    "Aligns multi-line text left, centred or right.",
  "help.arcRadius":
    "Radius of the circle the text sits on. Small radius = strong curve, large radius = gentle arc.",
  "help.shape":
    "The basic shape. Set width and height below or drag the corners in the preview.",
  "help.size":
    "Size in millimetres. The PP1 hoop is 10 × 10 cm.",
  "help.position":
    "Position of the element's centre, measured from the hoop centre. It is easier to move it in the preview or with the arrow keys.",
  "help.rotation":
    "Clockwise rotation in degrees. In the preview, rotate with the circle above the selection box; hold Shift for 15° steps.",
  "help.mode":
    "How the area is sewn.\nSatin: glossy, ideal for lettering and narrow shapes up to 7 mm.\nFill: for larger areas.\nWith outline or satin border: clean edges.\nOutline only: triple running stitch, good for very small text.\nAppliqué: a sewn-on piece of fabric with a satin border.",
  "help.angle":
    "Direction of the stitch rows in a fill. Different angles on neighbouring areas make them catch the light differently.",
  "help.density":
    "Distance between fill rows. Smaller = denser and more opaque, but stiffer. 0.4 mm is a good default; rather 0.45 on thin jersey.",
  "help.satinSpacing":
    "Distance between satin stitches. Smaller = smoother and glossier, but more stitches. 0.25–0.35 mm is typical.",
  "help.underlay":
    "A loose layer of stitches under the actual area. It holds the fabric and stops it from showing through. Almost always leave it on.",
  "help.borderWidth":
    "Width of the satin border around the area in mm.",
  "help.coverWidth":
    "Width of the satin border covering the edge of the appliqué fabric. 3–4 mm reliably cover frayed edges.",
  "help.outline":
    "Outline: a satin border in a second colour around the letters, typical for sports lettering.\nShadow: an offset copy in a darker colour behind the text.",
  "help.outlineWidth":
    "Width of the outline, or how far the shadow is shifted to the lower right.",
  "help.monoLetters":
    "Two or three letters. In the classic style the middle one is sewn large.",
  "help.monoStyle":
    "Classic: middle letter large, outer ones smaller. Equal size: all letters the same height.",
  "help.monoFrame":
    "Optional satin frame around the monogram, with its own width, gap and colour.",
  "help.color":
    "Choose the thread range at the top and search by number or name. Mark threads you own with the star; “My threads” then shows only those.\nScreen colours are approximations; the number on the spool is what counts.",
  "help.svgColors":
    "“Colours from the file” keeps the logo colours, matched to your threads. Click a colour to swap it. “One colour” sews the whole logo in a single colour.",
  "help.preview":
    "The preview shows the design in the 10 × 10 cm hoop on the chosen fabric colour. Jump threads are the connections you trim after sewing.\n“Centre design” moves the whole design to the hoop centre.",
  "help.simulation":
    "Plays the sewing order back stitch by stitch. You see beforehand in which order it is sewn, where jumps occur and when the machine stops for a colour change.",
  "help.stats":
    "Stitches, size and approximate sewing time. The thread amounts are an estimate to judge whether a spool is still enough.",
  "help.sequence":
    "Order of the colours. At every change the machine stops and you thread the next colour. Fewer changes save time: put same-coloured elements next to each other in the list.",
  "help.machine":
    "Pair the PP1 once in the Windows Bluetooth settings. Then: connect, send the design, mask trace (the machine traces the outline), prepare sewing and press start on the machine.\nIf something goes wrong, Stichwerk shows the steps to fix it here.",

  "footer.credits":
    "Stichwerk is free software (GPL-3.0) and an independent project, not affiliated with Brother or Madeira.",
};
