# KPI Tile Layout Normalization - Visual QA Checklist

## Overview
This document provides visual QA steps to verify that all KPI cards maintain equal height across different viewport sizes and that tooltips don't cause layout shifts.

## Implementation Details

### Code Changes Made
1. **KPICard.tsx**: Added `pointer-events-none` to tooltip to prevent layout shifts during hover
2. **KPISection.tsx**: Added explicit breakpoint coverage (`md:`, `lg:`, `2xl:`) for consistent grid behavior
3. **Tests**: Created comprehensive test suites for both components

### Technical Foundation
- **Grid Layout**: `auto-rows-fr` ensures equal height distribution
- **Card Height**: `h-full` on wrapper forces cards to fill grid cell height
- **Flex Distribution**: `flex flex-col` on Card component enables proper content flow
- **Tooltip Positioning**: `pointer-events-none` prevents layout shifts when tooltip appears

---

## Visual QA Checklist

### Mobile View (< 768px)
**Viewport Size**: Test at iPhone SE (375px), iPhone 12 (390px), iPhone 14 Pro (393px), and iPad (768px - 1px)

- [ ] Single column layout displays
- [ ] Cards stack vertically with consistent spacing (24px gap)
- [ ] All three cards visible without horizontal scroll
- [ ] Card height grows naturally with content
- [ ] Tooltip appears above card when hovering (if visible at small sizes)
- [ ] No layout shift when hovering over card
- [ ] Text is fully readable and not truncated
- [ ] Icon hover animation works (scale 110%)
- [ ] Subtext wraps properly without affecting card layout
- [ ] Long employee names wrap correctly in subtext

**Screenshots to Capture:**
- [ ] Full dashboard view showing all three cards stacked
- [ ] Hover state showing tooltip above card
- [ ] Card with long employee names in subtext

---

### Tablet View (768px - 1023px) - `md:grid-cols-3`
**Viewport Size**: iPad (768px), iPad Air (768px), Samsung Galaxy Tab (768px), typical tablet landscape

- [ ] **Three-column grid displays** (md:grid-cols-3)
- [ ] **All three cards visible in single row**
- [ ] **All cards have EXACT same height** (this is critical)
  - Compare Active Onboardings card height with Stuck Employees card
  - Compare Stuck Employees card height with Doc Feedback card
  - All three should align at top and bottom
- [ ] Gap spacing is consistent (24px between columns)
- [ ] Tooltip appears centered above card without cutoff at edges
- [ ] **No layout shift when tooltip appears** (critical for CLS - Cumulative Layout Shift)
- [ ] Card shadow appears on hover
- [ ] Hover state is smooth and responsive
- [ ] Icon hover animation works (scale 110%)
- [ ] Value hover animation works (scale 105%)
- [ ] Subtext with "Needs attention" or "Pending review" doesn't break equal height
- [ ] Long employee names in subtext don't increase card height

**Measurements to Verify:**
```
Expected at md breakpoint (768px):
- Grid: grid-cols-1 → md:grid-cols-3 (3 equal columns)
- Gap: 24px (gap-6)
- Card Height: All three cards should have same height
- Card Width: (viewport width - padding - gaps) / 3
```

**Screenshots to Capture:**
- [ ] Full dashboard with three-column grid (no hover)
- [ ] Hover state on "Active Onboardings" card showing tooltip
- [ ] Hover state on "Stuck Employees" card showing tooltip with employee names
- [ ] Hover state on "Doc Feedback" card showing tooltip
- [ ] Side-by-side comparison showing equal card heights (measure with dev tools)

---

### Desktop View (1024px - 1279px) - `lg:grid-cols-3`
**Viewport Size**: MacBook Air 13" (1280px - 1px), common laptop sizes (1024px, 1152px, 1280px)

- [ ] **Three-column grid displays** (lg:grid-cols-3)
- [ ] **All three cards visible in single row**
- [ ] **All cards have EXACT same height**
  - Use browser DevTools to verify CSS-applied height
  - Check that `auto-rows-fr` is distributing height equally
- [ ] Comfortable spacing between cards (24px gap)
- [ ] Tooltip appears above card without cutoff
- [ ] **No layout shift when tooltip appears** (verify CLS metrics)
- [ ] Card shadow is visible and prominent on hover
- [ ] All hover animations are smooth
- [ ] Icon hover animation works (scale 110%)
- [ ] Value hover animation works (scale 105%)
- [ ] Content alignment is proper
- [ ] Color-coded borders (emerald, rose, amber) are visible

**CSS Verification in DevTools:**
1. Inspect the grid container
   - Should show: `display: grid`
   - Should show: `grid-template-columns: repeat(3, minmax(0, 1fr))`
   - Should show: `grid-auto-rows: 1fr`
   - Should show: `gap: 1.5rem` (24px)

2. Inspect a KPI card wrapper
   - Should show: `height: 100%` (h-full)
   - Should show: Grid cell is filling available height

3. Inspect the Card element
   - Should show: `display: flex`
   - Should show: `flex-direction: column` (flex-col)

**Screenshots to Capture:**
- [ ] Full dashboard with three-column grid at 1024px
- [ ] Same at 1152px
- [ ] Same at 1280px
- [ ] DevTools Inspector showing grid CSS
- [ ] DevTools Inspector showing card height CSS
- [ ] Hover state on each card
- [ ] Tooltip positioning on each card

---

### Large Desktop View (>= 1280px) - `2xl:grid-cols-3`
**Viewport Size**: MacBook Pro 16" (1728px), 4K monitor sections (1280px+), wide ultrawide monitors

- [ ] **Three-column grid displays** (2xl:grid-cols-3)
- [ ] **All three cards visible in single row**
- [ ] **All cards have EXACT same height**
- [ ] Plenty of whitespace around grid
- [ ] Cards don't stretch excessively wide
- [ ] Tooltip appears well above card with breathing room
- [ ] **No layout shift when tooltip appears**
- [ ] All animations and hover effects work properly
- [ ] Content is well-proportioned and not stretched

**Responsive Breakdown Table:**
```
Breakpoint      Grid Layout    Media Query         Behavior
─────────────────────────────────────────────────────────────
Mobile          1 col          < 768px            Stack vertically
Tablet/Md       3 cols         768px - 1023px     Equal height grid
Desktop/Lg      3 cols         1024px - 1279px    Equal height grid
Large Desk/2xl  3 cols         >= 1280px          Equal height grid
```

---

## Tooltip Behavior Verification

### No Layout Shift (Critical for Web Vitals)
The tooltip uses `pointer-events-none` which means:
1. Tooltip doesn't interfere with mouse events
2. Layout doesn't shift when tooltip appears (improves CLS - Cumulative Layout Shift)
3. Tooltip doesn't cause scroll bars to appear/disappear

**Test Steps:**
1. Open DevTools → Metrics tab (or use Lighthouse)
2. Hover over each KPI card at each breakpoint
3. Watch for layout shifts (cards should NOT move when tooltip appears)
4. Verify CLS metric remains low (target: < 0.1)

**To Verify pointer-events-none:**
1. Inspect the tooltip element in DevTools
2. Verify it has class `pointer-events-none`
3. In Computed styles, should show: `pointer-events: none`

---

## Automated Test Coverage

### KPICard Component Tests (26 tests)
✅ All passing - Covers:
- Equal height behavior (`h-full`)
- Flex layout (`flex-col`)
- Tooltip display and hiding
- Pointer-events-none application
- Color variants
- Hover effects
- Accessibility features
- Edge cases (long content, empty values)

### KPISection Component Tests (29 tests)
✅ All passing - Covers:
- Grid layout with auto-rows-fr
- Responsive breakpoints (md, lg, 2xl)
- KPI calculations
- Layout preservation with content variations
- Tooltip behavior
- DOM structure

**Run Tests:**
```bash
npm test -- KPICard.test.tsx KPISection.test.tsx
```

Expected output: `55 passed (55)` ✅

---

## Detailed Breakpoint Specifications

### Tailwind CSS Breakpoints Used

| Breakpoint | Min Width | CSS Applied | Cards |
|-----------|-----------|-------------|-------|
| (base)    | 0px       | `grid-cols-1` | 1 |
| `md:`     | 768px     | `md:grid-cols-3` | 3 |
| `lg:`     | 1024px    | `lg:grid-cols-3` | 3 |
| `2xl:`    | 1280px    | `2xl:grid-cols-3` | 3 |

### Grid Properties Applied

```css
/* Grid Container (KPISection) */
.grid {
  display: grid;
  grid-template-columns: 1fr;           /* Mobile: 1 column */
  grid-auto-rows: 1fr;                  /* Equal height rows */
  gap: 1.5rem;                          /* 24px spacing */
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* Tablet+: 3 equal columns */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* Desktop: 3 equal columns */
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* Large: 3 equal columns */
  }
}

/* KPI Card Wrapper */
.card-wrapper {
  position: relative;
  height: 100%;                          /* Fills grid cell height */
}

/* Card Component */
.card {
  display: flex;
  flex-direction: column;                /* Stack content vertically */
  height: 100%;                          /* Inherit wrapper height */
  /* ... other styles ... */
}

/* Tooltip */
.tooltip {
  pointer-events: none;                  /* Prevents layout shifts */
  /* ... positioning ... */
}
```

---

## Common Issues and Solutions

### Issue: Cards Have Different Heights
**Cause:** `auto-rows-fr` not applied or `h-full` missing
**Solution:** Verify grid has `auto-rows-fr` and card wrapper has `h-full`
```tsx
// Grid - should have auto-rows-fr
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">

// Card wrapper - should have h-full
<div className="relative h-full">
  <Card className="... h-full flex flex-col ...">
```

### Issue: Tooltip Causes Layout Shift
**Cause:** Tooltip uses absolute positioning without `pointer-events-none`
**Solution:** Add `pointer-events-none` to tooltip
```tsx
<div className="... pointer-events-none">
  {tooltip}
</div>
```

### Issue: Subtext Breaks Equal Height
**Cause:** Content not using flexbox for proper distribution
**Solution:** Ensure Card uses `flex flex-col` and gaps are managed
- Optional subtext should not affect card height
- Card should distribute height across all children

---

## Performance Checklist

### Core Web Vitals
- [ ] **LCP (Largest Contentful Paint)**: < 2.5s
  - Dashboard cards should load and render quickly
- [ ] **FID/INP (Interaction to Next Paint)**: < 100ms
  - Hover animations should be smooth
  - Tooltips should appear without delay
- [ ] **CLS (Cumulative Layout Shift)**: < 0.1
  - Critical: No layout shift when tooltip appears
  - Verify with DevTools Metrics tab

### Lighthouse Score
Run Lighthouse audit at each breakpoint:
```
Mobile: Target 85+
Desktop: Target 90+
```

---

## Files Modified

1. **src/components/manager/KPICard.tsx**
   - Added: `pointer-events-none` to tooltip

2. **src/components/manager/KPISection.tsx**
   - Added: `lg:grid-cols-3` and `2xl:grid-cols-3` explicit breakpoints

3. **src/components/manager/KPICard.test.tsx** (NEW)
   - 26 comprehensive tests covering equal height, tooltips, accessibility

4. **src/components/manager/KPISection.test.tsx** (NEW)
   - 29 comprehensive tests covering grid layout, responsive behavior

---

## Sign-Off

QA Verification completed by: _________________ Date: _________

- [ ] Mobile view verified
- [ ] Tablet view verified
- [ ] Desktop view verified
- [ ] Large desktop view verified
- [ ] Tooltip behavior verified
- [ ] No layout shifts observed
- [ ] All tests passing
- [ ] Lighthouse scores acceptable

---

## Appendix: How to Use This Checklist

1. **For Manual QA Testing:**
   - Use the viewport sizes listed for each breakpoint
   - Follow the checklist items in order
   - Take screenshots as specified
   - Document any deviations

2. **For Automated Testing:**
   - Run: `npm test -- KPICard.test.tsx KPISection.test.tsx`
   - All 55 tests should pass
   - No manual testing required for code coverage

3. **For DevTools Inspection:**
   - Right-click on grid → Inspect
   - Check Computed styles section
   - Verify CSS properties match expected values
   - Use DevTools Metrics to check CLS

4. **For Responsive Testing:**
   - Use Chrome DevTools Device Emulation
   - Or use physical devices at specified sizes
   - Test with different content lengths (short/long names)
   - Test at extreme breakpoints (767px, 768px, 1023px, 1024px, 1279px, 1280px)
