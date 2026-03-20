# Design System Strategy: Kinetic Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "High-Performance Kineticism"**

This design system moves beyond the static, "boxed" nature of traditional fitness apps to create an experience that feels as dynamic as an elite athlete in motion. We are abandoning the rigid, table-based layouts of the past in favor of an **Editorial-High-Contrast** aesthetic.

By leveraging intentional asymmetry, oversized "Lexend" display type, and layered depth, we create a digital environment that feels premium, energetic, and authoritative. This is not a utility tool; it is a high-end training partner. The system breaks the "template" look by treating every screen as a magazine spread—utilizing breathing room (white space) and "Plus Jakarta Sans" for sophisticated legibility.

---

## 2. Colors & Surface Architecture
Our palette is rooted in the high-energy tension between the deep, nocturnal `surface` and the incendiary `primary` orange.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections or cards. Structural separation must be achieved through:
1. **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
2. **Negative Space:** Using the Spacing Scale (specifically `8`, `12`, and `16`) to create mental boundaries.
3. **Color Blocking:** Using a full-bleed `primary-container` section to disrupt a dark scroll.

### Surface Hierarchy & Nesting
To create a "High-End" feel, we treat the UI as physical layers.
- **Base Layer:** `surface` (#0e0e0e) for the global canvas.
- **Secondary Layer:** `surface-container-low` (#131313) for large content sections.
- **Interactive Layer:** `surface-container-high` (#1f2020) for clickable cards or modals.
- **Glassmorphism:** Use `surface-variant` with a 60% opacity and a `20px` backdrop-blur for floating navigation bars or sticky headers. This allows the kinetic energy of background photography to "bleed" through.

### Signature Textures
Main CTAs and Hero sections should utilize a **Subtle Linear Gradient** (135° from `primary` to `primary-container`) rather than a flat fill. This adds a sense of "glow" and metallic finish reminiscent of high-end gym equipment.

---

## 3. Typography
We employ a dual-typeface system to balance raw power with technical precision.

* **Display & Headlines (Lexend):** Chosen for its geometric stability and high-energy "track and field" feel. Use `display-lg` for motivation headers and `headline-md` for workout titles.
* **Body & Labels (Plus Jakarta Sans):** A modern, sophisticated sans-serif that ensures high-performance readability during intense physical activity.

**Editorial Hierarchy:**
- **Asymmetric Scaling:** Pair a `display-lg` heading with a `body-sm` description to create a high-contrast visual "punch."
- **All-Caps Accents:** Use `label-md` in all-caps with `0.1rem` letter-spacing for category tags (e.g., "STRENGTH," "HIIT") to evoke sports apparel branding.

---

## 4. Elevation & Depth
We eschew traditional "drop shadows" in favor of **Tonal Layering.**

* **The Layering Principle:** A `surface-container-highest` card sitting on a `surface` background creates a natural elevation.
* **Ambient Shadows:** For floating elements (like a "Start Workout" FAB), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0,0,0,0.4)`. The shadow must never be pure black; it should feel like a soft occlusion of light.
* **The "Ghost Border" Fallback:** If an element requires more definition (e.g., on an image background), use a `1px` stroke using the `outline-variant` token at **15% opacity**. This provides a "whisper" of a boundary without cluttering the UI.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `full` roundedness, `headline-sm` text. These are the "power" actions.
- **Secondary:** `surface-container-highest` fill with `primary` text. No border.
- **Tertiary:** Pure text using `primary` color, styled as `title-sm`.

### Cards (The "Training Tile")
- **Style:** Never use dividers. Separate the exercise name from the "Duration" using a `surface-container-high` background for the container and a `surface-variant` background for a small info-badge inside the card.
- **Corner Radius:** Use `xl` (1.5rem) for main dashboard cards to feel modern and approachable.

### Input Fields
- **Style:** Understated. Use `surface-container-lowest` as the fill.
- **States:** On focus, the container does not get a thick border; instead, the background shifts to `surface-container-highest` and the label text transitions to `primary`.

### Progress Rings & Data Viz
- **Style:** Use a `12px` stroke width with `round` line-caps.
- **Visuals:** The "track" of the progress bar should be `outline-variant` at 20% opacity. The "active" bar should be a vibrant `primary` to `tertiary` gradient to represent "heat" and energy.

---

## 6. Do's and Don'ts

### Do
- **Do** use large-scale, professional fitness photography with a "moody" lighting style (high shadows, crisp highlights).
- **Do** use `24` (6rem) vertical spacing between major sections to let the design breathe.
- **Do** overlap elements (e.g., an athlete's head in a photo breaking the container of the card above it) to create a sense of 3D space.

### Don't
- **Don't** use 100% opaque white for body text; use `on_surface_variant` (#acabaa) for secondary info to keep the "Deep Charcoal" atmosphere.
- **Don't** use standard 4px rounded corners; they look "bootstrap" and dated. Stick to `lg` (1rem) and `xl` (1.5rem).
- **Don't** use horizontal divider lines (`
`). Use a `6.5` spacing gap or a tonal background shift instead.


### Accessibility Note
While maintaining a high-contrast editorial look, ensure all `primary` on `surface` combinations meet WCAG AA standards. When using orange text on dark backgrounds, use `primary_fixed` to ensure the luminance is high enough for legibility.```