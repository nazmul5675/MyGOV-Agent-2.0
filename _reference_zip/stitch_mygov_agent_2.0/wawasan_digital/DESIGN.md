# Design System Specification: The Sovereign Digital Experience

## 1. Overview & Creative North Star
**The Creative North Star: "The Resilient Monolith"**

To design for a nation is to design for permanence, trust, and progress. This design system rejects the "government template" aesthetic—characterized by cluttered grids and harsh borders—in favor of a high-end editorial approach. We treat the interface as a digital extension of the state: authoritative yet accessible, sophisticated yet inclusive. 

The visual language moves away from rigid containment. Instead, it utilizes **Tonal Depth** and **Intentional Asymmetry** to guide the eye. We break the "boxy" feel by layering surfaces and using extreme typographic scale contrasts, ensuring that the citizen feels they are entering a secure, premium, and modern environment.

---

## 2. Colors: A Sophisticated Heritage
The palette takes the Jalur Gemilang’s DNA and deconstructs it into a professional, "State-Modern" aesthetic.

### The Foundation
*   **Primary (`#001e40`)**: Our "Deep Royal Blue." Use this for core navigational elements and high-authority headers. It represents the strength of the federation.
*   **Secondary (`#6f5d00`)**: Our "Sovereign Gold." Used sparingly for high-value accents, verified statuses, or "Royal" notifications. It adds a premium, bespoke layer to the experience.
*   **Tertiary (`#460003`)**: Our "Alert Red." A deep, sophisticated crimson reserved for critical actions and alerts, moving away from the "panic red" of standard UI.

### Surface & Atmosphere
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be created through background shifts. For example, a `surface-container-low` component should sit directly on a `background` field. The eye identifies the change in tone, not a physical line.
*   **The Glass & Gradient Rule:** For hero sections and primary CTAs, use a subtle linear gradient from `primary` to `primary_container`. For floating mobile menus or citizen dashboards, utilize **Glassmorphism**: `surface` color at 80% opacity with a `24px` backdrop blur.
*   **Nesting Logic:** Create depth by stacking. A `surface-container-lowest` card (Pure White) should sit on a `surface-container-low` background to create a "lifted" feel without using drop shadows.

---

## 3. Typography: Authoritative Clarity
We pair **Public Sans** (Display/Headline) for its geometric authority with **Inter** (Body/Labels) for its unrivaled legibility in dense data environments.

*   **Display (Public Sans):** Use `display-lg` (3.5rem) with `-0.02em` tracking for major landing pages. The scale should feel "editorial"—unapologetically large.
*   **Headlines (Public Sans):** `headline-sm` (1.5rem) should be used for card titles. Bold weight is preferred to ensure a high-contrast hierarchy.
*   **Body (Inter):** `body-lg` (1rem) is the standard for citizen-facing content. For officer-facing "dense" dashboards, default to `body-md` (0.875rem) to maximize information density without sacrificing clarity.
*   **The Identity Gap:** Maintain a significant "optical gap" between headlines and body text. Use a 2:1 ratio for vertical spacing to allow the typography to breathe, reflecting a "Modern State" transparency.

---

## 4. Elevation & Depth: Tonal Layering
We move beyond the Material Design "Drop Shadow" defaults. Depth is an atmosphere, not a decoration.

*   **The Layering Principle:** 
    1.  **Level 0 (Base):** `background` (#f8f9fa).
    2.  **Level 1 (Sections):** `surface-container-low` (#f3f4f5).
    3.  **Level 2 (Interactive Cards):** `surface-container-lowest` (#ffffff).
*   **Ambient Shadows:** If a card must float (e.g., a critical "Action Required" modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(25, 28, 29, 0.05)`. Note the low 5% opacity—it should feel like ambient light, not a black glow.
*   **The "Ghost Border":** For input fields where accessibility requires a boundary, use `outline-variant` at **20% opacity**. This provides a "suggestion" of a container while maintaining the clean, borderless aesthetic.

---

## 5. Components: Refined Utility

### Buttons (The Anchor)
*   **Primary:** Solid `primary` background. `rounded-md` (0.375rem). No shadow. On hover, transition to `primary_container`.
*   **Secondary (Sovereign):** `secondary_container` background with `on_secondary_container` text. This is for high-priority citizen actions (e.g., "Apply Now").
*   **Tertiary:** Ghost style. No background, `primary` text. Use for "Cancel" or "Back."

### Cards (The Information Vessel)
*   **Rule:** Forbid all divider lines within cards.
*   **Implementation:** Use `body-sm` labels in `on_surface_variant` (Grey) to label data points, and `title-md` for the values. Separate groups using the Spacing Scale (e.g., 24px vertical gaps).
*   **Status Indicators:** Use semi-transparent pill shapes.
    *   *Active:* `primary_fixed` background with `on_primary_fixed` text.
    *   *Action Required:* `tertiary_fixed` background with `on_tertiary_fixed_variant` text.

### Input Fields
*   **Style:** Minimalist. No bottom line, no full border. Use a subtle `surface-container-high` background fill with a `rounded-sm` corner. On focus, the background transitions to `surface-container-lowest` with a 2px `primary` "Ghost Border."

### Citizen Dashboard "Quick-Action" Chips
*   Large, `xl` rounded chips (0.75rem). Use `surface-variant` backgrounds. These should feel tactile and mobile-friendly for citizens on the go.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme whitespace. If you think there’s enough room between sections, double it. This conveys "Trust" and "Calm."
*   **Do** use `secondary` (Gold) for "Verified" badges or "Official Seal" elements to reinforce government authenticity.
*   **Do** prioritize a mobile-first "stack" for citizens, but use `surface-container` nesting for officers to allow for side-by-side data comparisons.

### Don’t:
*   **Don’t** use pure black (#000000). Always use `on_surface` (#191c1d) to maintain a premium, ink-like softness.
*   **Don’t** use traditional "Alert Yellow." Use the `secondary_fixed` (Gold) for warnings to maintain the "Jalur Gemilang" sophisticated palette.
*   **Don’t** use 100% opaque borders. They clutter the UI and create "Visual Noise" that slows down officer processing times.

---

## 7. Accessibility
High contrast is non-negotiable. Ensure all text on `primary` or `tertiary` containers meets WCAG AAA standards. Use the `on_` token series (e.g., `on_primary`) strictly to guarantee that text-to-background ratios never fall below 7:1 for critical data.