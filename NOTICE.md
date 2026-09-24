# Lizenz und Drittanbieter-Hinweise / Licence and third-party notices

**Stichwerk** – © 2026 herschi1 – GNU General Public License v3.0 oder später / or later
(`LICENSE`). Quellcode / source code: https://github.com/herschi1/stichwerk

Stichwerk ist ein unabhängiges Hobbyprojekt und steht in keiner Verbindung zu Brother
Industries, Ltd. oder zur Madeira Garnfabrik. Nutzung auf eigenes Risiko, ohne Gewähr.
/ Stichwerk is an independent hobby project and is not affiliated with Brother Industries,
Ltd. or Madeira Garnfabrik. Use at your own risk, without warranty.

Brother, SKiTCH und Artspira sind Marken der Brother Industries, Ltd.; Madeira, Polyneon und
Frosted Matt sind Marken der Madeira Garnfabrik. Die Namen werden nur beschreibend verwendet.
/ Brand names are used for descriptive purposes only.

## Verwendete Werke / Works used

- **Respira** – https://github.com/jhbruhn/respira – © jhbruhn – Apache License 2.0
  (`LICENSES/Apache-2.0-Respira.md`).
  Übernommen und angepasst / taken over and modified: Bluetooth-Protokoll der Brother PP1
  (`src/machine/BrotherPP1Service.ts`), PEN-Encoder/-Decoder (`src/machine/pen/`),
  Maschinen-Typen (`src/machine/types.ts`), Brother-Garnfarben (`src/data/BrotherColor.json`).
  Fehlercodes, Zustandsregeln und das Zurückgehen nach Fadenfehlern folgen Respira, die
  Texte wurden neu geschrieben. / Error codes, state rules and thread-error rollback follow
  Respira; texts rewritten.

- **pyembroidery / pystitch** – © Tatarize – MIT License (`LICENSES/MIT-pyembroidery.txt`).
  PES/PEC-Export (`src/io/pes.ts`, `src/io/pecData.ts`) als TypeScript-Portierung.

- **Ink/Stitch** – https://inkstitch.org – GNU GPL v3.0 (`LICENSE`).
  Farbwerte der Madeira-Sortimente Polyneon 40, Classic Rayon 40 und Frosted Matt 40
  (`src/data/madeira-*.json`) aus den Ink/Stitch-Palettendateien. Bildschirmfarben sind
  Annäherungen an das echte Garn. / Screen colours approximate the real thread.

- **Schriften / Fonts** – 30 Google-Fonts-Schriften unter SIL Open Font License 1.1 bzw.
  Apache License 2.0, Übersicht / overview: `public/fonts/FONTS.md`.

- **opentype.js** – MIT License; **React**, **zustand** – MIT License (npm-Abhängigkeiten).
