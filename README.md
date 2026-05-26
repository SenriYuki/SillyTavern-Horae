# Horae v1.14.6 - Memory Engine for SillyTavern

**English** | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

Image

> *Horae — Greek goddesses who governed the orderly progression of time*

Long-form RP players know the pain: AI memory is basically a goldfish. Yesterday's events become "this morning," costumes change between paragraphs, NPC relationships flip, gifted items vanish, and discarded ones reappear.

**Horae gives your AI a reliable memory ledger using structured time anchors.**

---

## Features

### Core Memory System

- **Timeline Tracking** — Events are timestamped with relative time calculations ("yesterday", "last Wednesday", "2 months ago"). AI finally knows the difference.
- **Costume Lock** — Each character's current outfit is recorded and only sent for present characters. No more phantom wardrobe changes.
- **NPC Tracking** — Appearance, personality, relationships tracked independently. Ages advance with story time. Relationship prompts are strictly enforced.
- **Item Inventory** — Unique ID system with Normal / Important / Critical tiers. Smart quantity parsing, auto-detection of consumed items.
- **Agenda** — AI automatically records plot promises and deadlines. Completed items are auto-removed.
- **Mood & Relationships** — Emotion tracking keeps characters consistent. Relationship network records bonds between characters. Both are change-driven: zero output when nothing changes.
- **Scene Memory** — Records fixed physical features of locations for consistent descriptions across visits.

### RPG System (Modular)

- **Status Bars** — HP/MP/SP with custom names, colors. Dozens of status effect icons.
- **Attribute Panel** — Multi-dimensional stats (STR/DEX/CON/INT/WIS/CHA) with radar chart.
- **Skills** — Track skill ownership, levels, and descriptions.
- **Equipment** — Per-character slot configs with 6 racial templates (Human, Orc, Centaur, Lamia, Winged, Demon). Custom templates supported.
- **Reputation** — Custom faction categories with sub-dimensions.
- **Level / XP** — Experience formula with visual progress bars.
- **Currency** — Custom denominations with emoji icons and exchange rates.
- **Strongholds** — Tree-structured base/territory management.
- All modules are **independently toggleable**. Disabled = zero token cost.

### Smart Token Management

- **Auto Summary & Hide** — Automatically compresses old messages into AI-generated summaries. Original messages are `/hide`d to save tokens. Summaries can be toggled back to original events anytime.
- **Vector Memory** — Semantic search engine that recalls hidden details when conversation touches historical events. Runs locally via Web Worker — zero API cost.
- **AI Batch Scan** — One-click retroactive analysis of entire chat history.
- **Auxiliary API** — Route AI analysis, auto-summary, smart enrich, and manual compression through a separate OpenAI-compatible endpoint. Requests are queued to avoid auxiliary endpoint rate spikes, and API credentials are never exported with Horae config profiles.
- **Change-Driven Output** — AI only outputs what changed this turn. No redundant state dumps.

### User Experience

- **Custom Tables** — Excel-style tables with AI auto-fill, row/column locking, undo/redo.
- **Theme Designer** — Visual theme editor with hue/saturation sliders, image decorations, day/night modes. Export & share themes as JSON.
- **Interactive Tutorial** — First-time users get a guided walkthrough of all features.
- **Custom Prompts** — Full control over system injection, batch scan, compression, and RPG prompts. Preset save/load system.
- **Config Profiles** — Export all settings as a JSON file. Card authors can share configs for one-click setup.

---

## Installation

1. Open SillyTavern → Extensions panel (puzzle icon) → **Install Extension**
2. Paste this repository's Git URL and click Install
3. Refresh the page — done!

> The companion regex is **auto-injected** on first load. No manual import needed.

---

## Compatibility

- **SillyTavern**: 1.13.0+ (AI analysis requires 1.13.5+)
- **Platforms**: Desktop + Mobile

---

## Public API (for other extensions / presets)

After Horae loads, a read-only API is available at `window.Horae`:

```js
// Check if Horae is installed and enabled
window.Horae?.isEnabled()        // → true / false

// Read current world state (time, location, characters, costumes, items, mood, npcs…)
window.Horae?.getLatestState()   // → state object

// Read timeline events
window.Horae?.getEvents(10)      // → last 10 events

// Read settings (shallow copy)
window.Horae?.getSettings()

// Version string
window.Horae?.version            // → "1.14.0"
```

Settings change events are broadcast via SillyTavern's `eventSource`:

```js
eventSource.on('horae:settingsChanged', (data) => {
    console.log('Horae enabled:', data.enabled);
});
```

> All methods are **read-only**. No write operations are exposed.

---

## Language Support


| Language                   | Status |
| -------------------------- | ------ |
| 简体中文 (Simplified Chinese)  | ✅ Full |
| 繁體中文 (Traditional Chinese) | ✅ Full |
| English                    | ✅ Full |
| 한국어 (Korean)               | ✅ Full |
| 日本語 (Japanese)             | ✅ Full |
| Русский (Russian)          | ✅ Full |


**Want Horae in your language?** Open an [Issue](https://github.com/SenriYuki/SillyTavern-Horae/issues) or submit a PR with a translation file! See `locales/en.json` for the translation template.

---

## What's New in v1.14.0

### Auxiliary API

- New standalone **Auxiliary API** settings section for OpenAI-compatible endpoints.
- Choose where to use it: AI analysis / magic wand / pre-send timeline fill, auto-summary + AI smart enrich, or manual multi-select compression.
- Auxiliary API requests run through a serial queue to reduce endpoint 429s.
- Fallback to the main API is available but off by default.
- API URL, key, and model are excluded from Horae config profile exports.

See [CHANGELOG](CHANGELOG.md) for full version history.

---

Bug reports and suggestions are welcome!

> ⚠️ This is a side project — replies may be delayed. Thank you for your patience.

**Author: SenriYuki**

### Translation Credits

- **Russian (Русский)** — [@KiskaSora](https://github.com/KiskaSora)

### Credits

- [@baibai-git](https://github.com/baibai-git) — PR #5 integration contribution

