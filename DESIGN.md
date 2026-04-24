---
name: Fraude-Ary
description: Premium fintech portfolio tracker — dark-first, data-dense, institutional clarity.
colors:
  background: "#0B0D10"
  surface: "#13161B"
  surface-raised: "#1A1E24"
  surface-sunken: "#07080A"
  primary: "#6366F1"
  primary-hover: "#818CF8"
  primary-muted: "#312E81"
  secondary: "#22D3EE"
  secondary-hover: "#67E8F9"
  accent: "#10B981"
  accent-hover: "#34D399"
  danger: "#EF4444"
  danger-hover: "#F87171"
  warning: "#F59E0B"
  warning-hover: "#FBBF24"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-tertiary: "#64748B"
  text-muted: "#475569"
  border: "#1E293B"
  border-hover: "#334155"
  chart-positive: "#10B981"
  chart-negative: "#EF4444"
  chart-neutral: "#64748B"
  overlay: "rgba(0,0,0,0.6)"
typography:
  display:
    fontFamily: "Inter"
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "Inter"
    fontSize: 1.75rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "Inter"
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  h3:
    fontFamily: "Inter"
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter"
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Inter"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter"
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
    textTransform: "uppercase"
  mono:
    fontFamily: "JetBrains Mono"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
shadows:
  sm: "0 1px 2px rgba(0,0,0,0.3)"
  md: "0 4px 6px rgba(0,0,0,0.4)"
  lg: "0 10px 15px rgba(0,0,0,0.5)"
  glow: "0 0 20px rgba(99,102,241,0.15)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.body-sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border-hover}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-elevated:
    backgroundColor: "{colors.surface-raised}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{shadows.md}"
  input:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    typography: "{typography.body}"
  input-focus:
    borderColor: "{colors.primary}"
    shadow: "0 0 0 3px rgba(99,102,241,0.2)"
  badge-success:
    backgroundColor: "rgba(16,185,129,0.12)"
    textColor: "{colors.accent}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    typography: "{typography.label}"
  badge-warning:
    backgroundColor: "rgba(245,158,11,0.12)"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-danger:
    backgroundColor: "rgba(239,68,68,0.12)"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  sidebar:
    backgroundColor: "{colors.surface-sunken}"
    borderRight: "1px solid {colors.border}"
    width: "260px"
  table-header:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-tertiary}"
    typography: "{typography.label}"
    borderBottom: "1px solid {colors.border}"
  table-row:
    backgroundColor: "transparent"
    borderBottom: "1px solid {colors.border}"
  table-row-hover:
    backgroundColor: "{colors.surface-raised}"
  tooltip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    shadow: "{shadows.lg}"
---

## Overview

Fraude-Ary is a premium self-hosted portfolio tracker. The visual identity communicates **institutional trust** and **data clarity** — like a Bloomberg terminal meets a modern SaaS dashboard.

The design is **dark-first**. Light mode exists but is secondary. The interface is data-dense: tables, numbers, charts, and real-time feeds are the primary content. Every visual decision serves readability and hierarchy.

## Colors

The palette is built on a deep charcoal foundation with electric indigo as the primary action driver.

- **Background (#0B0D10):** Near-black. Creates immersion and reduces eye strain for data-heavy screens.
- **Surface (#13161B):** Card and panel backgrounds. Slightly lifted from the background.
- **Surface Raised (#1A1E24):** Hover states, elevated cards, dropdowns.
- **Surface Sunken (#07080A):** Inputs, code blocks, deepest layers.
- **Primary (#6366F1):** Electric indigo. The single action color. Buttons, active states, links.
- **Secondary (#22D3EE):** Cyan accent for data highlights, sparklines, secondary CTAs.
- **Accent (#10B981):** Emerald green exclusively for positive gains and success states.
- **Danger (#EF4444):** Red exclusively for losses, deletions, and errors.
- **Warning (#F59E0B):** Amber for alerts and attention flags.
- **Text Primary (#F8FAFC):** Near-white. Headlines, critical data.
- **Text Secondary (#94A3B8):** Slate gray. Body text, labels, metadata.
- **Text Tertiary (#64748B):** Muted slate. Timestamps, captions, disabled states.

## Typography

Inter is the workhorse — legible at small sizes, neutral, and modern. JetBrains Mono handles all numeric data to ensure tabular alignment.

- **Display:** Page titles. Bold, tight tracking. Maximum impact.
- **H1-H3:** Section hierarchies. Semi-bold, slightly negative tracking.
- **Body:** 15px base. Comfortable for long-form content.
- **Body SM:** 14px. Tables, cards, compact UI.
- **Label:** 12px uppercase. Table headers, badges, axis labels. Slight positive tracking for readability.
- **Mono:** All prices, percentages, quantities. Tabular numbers (`tnum`) ensure columns align.

## Layout

Spacing follows an 8px base grid with semantic scale steps.

- **xs (4px):** Tight internal padding, icon gaps.
- **sm (8px):** Inline spacing, badge padding.
- **md (16px):** Card internal padding, form field gaps.
- **lg (24px):** Section gaps, sidebar padding.
- **xl (32px):** Page-level padding.
- **2xl (48px):** Major section breaks.

## Elevation & Depth

Elevation is communicated through background color shifts, not shadows. Shadows are reserved for modals, dropdowns, and tooltips.

- **Surface layers:** Background → Surface → Surface Raised. Each step is ~7% lighter.
- **Shadows:** Used sparingly. `shadow-md` for dropdowns. `shadow-lg` for modals.
- **Glow:** Subtle indigo glow (`shadow-glow`) on focused primary buttons and active nav items.

## Shapes

- **Buttons & Inputs:** `rounded-md` (10px). Soft but defined.
- **Cards:** `rounded-lg` (14px). Distinct panels.
- **Badges & Pills:** `rounded-full`. Floating status indicators.
- **Tables:** No outer radius. Internal rows have `rounded-sm` on first/last cells only.

## Components

### Buttons

**Primary:** Indigo background, white text. Used for main actions (Add Asset, Save).
**Secondary:** Dark surface with border. Used for cancel, filter, secondary actions.
**Danger:** Red background for destructive actions (Delete, Remove).

All buttons have `rounded-md` and `padding: 10px 16px`.

### Cards

**Default:** `surface` background, `border` border, `rounded-lg`.
**Elevated:** `surface-raised` with `shadow-md`. Used for modals and focus panels.

### Inputs

Sunken dark background (`surface-sunken`) with `border`. On focus: indigo border + subtle glow ring.

### Badges

Subtle tinted backgrounds with solid text:
- Success: emerald text on emerald/10 background
- Warning: amber text on amber/10 background
- Danger: red text on red/10 background

### Tables

Header: `surface-sunken` background, uppercase label typography, bottom border.
Rows: transparent background, `border` bottom separator. Hover: `surface-raised`.
All numeric columns use `font-mono` with `tnum`.

### Sidebar

`surface-sunken` background with right border. 260px fixed width. Active item: indigo left border + indigo text.

## Do's and Don'ts

### Do
- Use `text-mono` for all currency values, percentages, and quantities.
- Maintain high contrast: text-primary on surface backgrounds is always readable.
- Use the 8px spacing scale consistently.
- Reserve green exclusively for gains / success.
- Reserve red exclusively for losses / errors.

### Don't
- Use shadows on cards or panels — rely on background color shifts for elevation.
- Mix more than one accent color in the same context.
- Use light gray text on light backgrounds (the system is dark-first).
- Add decorative elements that don't serve data readability.
