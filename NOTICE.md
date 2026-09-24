# Drittanbieter-Hinweise / Third-party notices

Stichwerk verwendet Teile folgender Projekte / uses parts of the following projects:

- **Respira** – https://github.com/jhbruhn/respira – © jhbruhn, Apache License 2.0.
  Übernommen / taken over: Bluetooth-Protokoll der Brother PP1
  (`src/machine/BrotherPP1Service.ts`), PEN-Encoder/-Decoder (`src/machine/pen/`),
  Maschinen-Typen (`src/machine/types.ts`), Brother-Garnfarbtabelle
  (`src/data/BrotherColor.json`). Fehlercodes, Zustandsregeln und die Logik zum
  Zurückgehen nach Fadenfehlern folgen Respira, Texte wurden neu geschrieben.
  / Error codes, state rules and thread-error rollback follow Respira; texts rewritten.
  Lizenztext / licence text: https://www.apache.org/licenses/LICENSE-2.0

- **Ink/Stitch** – https://inkstitch.org – GPL-3.0.
  Farbwerte der Madeira-Garnsortimente (Polyneon 40, Classic Rayon 40, Frosted Matt 40)
  aus den Ink/Stitch-Palettendateien (`src/data/madeira-*.json`). / Madeira thread colour
  values from the Ink/Stitch palette files. Madeira ist eine Marke der Madeira Garnfabrik. /
  Madeira is a trademark of Madeira Garnfabrik.

- **pyembroidery / pystitch** – © Tatarize, MIT License.
  PES/PEC-Export (`src/io/pes.ts`, `src/io/pecData.ts`) ist eine Portierung nach TypeScript.
  The PES/PEC export is a TypeScript port.

- **Schriften / Fonts** – 30 Google-Fonts-Schriften unter SIL Open Font License 1.1 bzw.
  Apache License 2.0, Übersicht / overview: `public/fonts/FONTS.md`.

- **opentype.js** – MIT License.

Brother, SKiTCH und Artspira sind Marken der Brother Industries, Ltd. Stichwerk ist ein
unabhängiges Projekt. / Brother, SKiTCH and Artspira are trademarks of Brother Industries,
Ltd. Stichwerk is an independent project.
