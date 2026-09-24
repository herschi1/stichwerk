/** Deutsche Texte. Platzhalter in {geschweiften Klammern} werden ersetzt. */
export const de = {
  "app.tagline": "Stickmuster gestalten für die Brother PP1",
  "lang.switch": "Sprache wechseln",

  "toolbar.new": "Neu",
  "toolbar.open": "Öffnen",
  "toolbar.save": "Speichern",
  "toolbar.importSvg": "SVG importieren",
  "toolbar.exportPes": "PES exportieren",
  "toolbar.confirmNew": "Aktuelles Design verwerfen und neu beginnen?",

  "elements.title": "Elemente",
  "elements.addText": "+ Text",
  "elements.addShape": "+ Form",
  "elements.empty": "Noch leer. Beginne mit einem Text, einer Form oder importiere ein SVG-Logo.",
  "elements.orderHint":
    "Gestickt wird von oben nach unten. Elemente gleicher Farbe hintereinander sparen Fadenwechsel.",
  "elements.earlier": "Früher sticken",
  "elements.later": "Später sticken",
  "elements.delete": "Löschen",

  "label.text": "Text: {text}",
  "label.emptyText": "(leer)",
  "label.svg": "Logo: {name}",

  "shape.heart": "Herz",
  "shape.circle": "Kreis / Oval",
  "shape.rect": "Rechteck",
  "shape.star": "Stern",

  "font.style.bold": "kräftig",
  "font.style.rounded": "rund",
  "font.style.serif": "Serifen",
  "font.style.script": "Schreibschrift",

  "edit.text": "Text (Enter für neue Zeile)",
  "edit.font": "Schrift",
  "edit.fontUpload": "Eigene Schrift laden (TTF/OTF/WOFF) …",
  "edit.letterHeight": "Höhe (mm)",
  "edit.letterSpacing": "Abstand (mm)",
  "edit.lineSpacing": "Zeilenabstand",
  "edit.shape": "Form",
  "edit.width": "Breite (mm)",
  "edit.height": "Höhe (mm)",
  "edit.posX": "Position links/rechts (mm)",
  "edit.posY": "Position oben/unten (mm)",
  "edit.mode": "Stichart",
  "edit.angle": "Stichwinkel (°)",
  "edit.density": "Reihenabstand (mm)",
  "edit.underlay": "Unterlage",
  "edit.color": "Garnfarbe (Brother)",
  "edit.smallText":
    "Bei Schrift unter 7 mm wird eine Füllung schnell klumpig. „Nur Kontur“ oder eine größere Höhe sticken sauberer.",

  "mode.fill": "Füllung",
  "mode.fill-outline": "Füllung mit Kontur",
  "mode.outline": "Nur Kontur (Bohnenstich)",

  "svg.colors": "Farben",
  "svg.fileColors": "Farben aus der Datei",
  "svg.singleColor": "Eine Farbe für alles",
  "svg.replaceColor": "Farbe anklicken, um sie zu ändern",

  "preview.fabric": "Stofffarbe",
  "preview.jumps": "Sprungfäden zeigen",
  "preview.zoomIn": "Vergrößern",
  "preview.zoomOut": "Verkleinern",
  "preview.fit": "Ganzen Rahmen zeigen",
  "preview.empty": "Hier erscheint dein Stickmuster.",
  "preview.outside": "Das Design ragt über den Stickrahmen (100 × 100 mm) hinaus.",

  "fabric.white": "Weiß",
  "fabric.grey": "Grau meliert",
  "fabric.black": "Schwarz",
  "fabric.navy": "Marine",
  "fabric.red": "Rot",
  "fabric.green": "Waldgrün",
  "fabric.pink": "Rosa",

  "stats.stitches": "{n} Stiche",
  "stats.colors": "{n} Farben",
  "stats.color": "1 Farbe",
  "stats.size": "{w} × {h} mm",
  "stats.time": "ca. {n} Min.",

  "sequence.title": "Farbreihenfolge",

  "machine.title": "Maschine",
  "machine.soon":
    "Die direkte Verbindung zur PP1 kommt mit der nächsten Version. Bis dahin: „PES exportieren“ und die Datei in Respira öffnen, um zu sticken.",

  "error.svgInvalid": "Die Datei ist kein gültiges SVG.",
  "error.svgEmpty":
    "Im SVG wurden keine gefüllten Flächen gefunden. Reine Linien ohne Füllung werden noch nicht unterstützt.",
  "error.projectInvalid": "Die Datei ist kein Stichwerk-Design.",
  "error.font": "Diese Schriftdatei konnte nicht gelesen werden.",
  "error.fontLoad": "Die Schrift konnte nicht geladen werden. Prüfe die Internetverbindung.",
  "error.generic": "Etwas ist schiefgelaufen: {msg}",

  "footer.credits":
    "Schriften unter SIL Open Font License. PES-Export nach pyembroidery (MIT). Maschinenprotokoll nach Respira (Apache-2.0).",
} as const;

export type TranslationKey = keyof typeof de;
