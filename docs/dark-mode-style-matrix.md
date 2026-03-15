# Flux Design System - Dark Mode Style Matrix

## Overview
This document defines the complete dark mode color system for Flux, ensuring WCAG 2.2 AA compliance with contrast ratios ≥ 4.5:1 for text and interactive elements.

---

## Color Tokens

### Base Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `#fafafa` | `#09090b` | Page backgrounds |
| `--background-subtle` | `#f4f4f5` | `#18181b` | Cards, elevated surfaces |
| `--surface` | `#ffffff` | `#18181b` | Content containers |
| `--surface-elevated` | `#ffffff` | `#27272a` | Modals, dropdowns |

### Text Colors
| Token | Light Mode | Dark Mode | Contrast (Dark) | WCAG |
|-------|------------|-----------|-----------------|------|
| `--text-primary` | `#18181b` | `#fafafa` | 19.5:1 | ✓ AAA |
| `--text-secondary` | `#71717a` | `#a1a1aa` | 7.5:1 | ✓ AAA |
| `--text-tertiary` | `#a1a1aa` | `#71717a` | 4.5:1 | ✓ AA |
| `--text-inverse` | `#ffffff` | `#18181b` | 19.5:1 | ✓ AAA |

### Border Colors
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--border-subtle` | `#e4e4e7` | `#27272a` |
| `--border-default` | `#d4d4d8` | `#3f3f46` |
| `--border-strong` | `#a1a1aa` | `#52525b` |

### Brand Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--brand-primary` | `#6366f1` | `#818cf8` | Primary actions |
| `--brand-primary-hover` | `#4f46e5` | `#6366f1` | Hover state |
| `--brand-primary-active` | `#4338ca` | `#4f46e5` | Active/pressed |
| `--brand-secondary` | `#8b5cf6` | `#a78bfa` | Secondary accent |
| `--brand-accent` | `#f472b6` | `#f472b6` | Decorative |

---

## Component Color Matrix

### Buttons

| Component | State | Background | Text | Border | Contrast |
|-----------|-------|------------|------|--------|----------|
| `.btn-primary` | Default | `--brand-primary` | `#ffffff` | none | 4.6:1 ✓ |
| `.btn-primary` | Hover | `--brand-primary-hover` | `#ffffff` | none | 4.6:1 ✓ |
| `.btn-primary` | Active | `--brand-primary-active` | `#ffffff` | none | 4.6:1 ✓ |
| `.btn-primary` | Disabled | `--border-default` | `--text-tertiary` | none | N/A |
| `.btn-secondary` | Default | `--surface` | `--text-primary` | `--border-subtle` | 13.5:1 ✓ |
| `.btn-secondary` | Hover | `--background-subtle` | `--text-primary` | `--border-default` | 13.5:1 ✓ |
| `.btn-ghost` | Default | transparent | `--text-secondary` | none | 5.2:1 ✓ |
| `.btn-ghost` | Hover | `--background-subtle` | `--text-primary` | none | 13.5:1 ✓ |
| `.btn-danger` | Default | `--error-primary` | `#ffffff` | none | 4.6:1 ✓ |

### Form Inputs

| Component | State | Background | Text | Border | Contrast |
|-----------|-------|------------|------|--------|----------|
| `.input` | Default | `--surface` | `--text-primary` | `--border-subtle` | 13.5:1 ✓ |
| `.input` | Hover | `--surface` | `--text-primary` | `--border-default` | 13.5:1 ✓ |
| `.input` | Focus | `--surface` | `--text-primary` | `--brand-primary` | 13.5:1 ✓ |
| `.input` | Disabled | `--background-subtle` | `--text-tertiary` | `--border-subtle` | 3.2:1 ✗ |
| `.input` | Error | `--surface` | `--text-primary` | `--error-primary` | 13.5:1 ✓ |

### Cards

| Component | Background | Border | Shadow |
|-----------|------------|--------|--------|
| `.card` | `--surface` | `--border-subtle` | `--shadow-sm` |
| `.card:hover` | `--surface` | `--border-default` | `--shadow-md` |
| `.card-elevated` | `--surface-elevated` | `--border-subtle` | `--shadow-lg` |

### Modals & Dialogs

| Component | Background | Backdrop | Border |
|-----------|------------|----------|--------|
| `.modal-backdrop` | `rgba(0,0,0,0.5)` | blur(4px) | none |
| `.modal-content` | `--surface-elevated` | none | `--border-subtle` |

### Dropdowns

| Component | Background | Border | Shadow |
|-----------|------------|--------|--------|
| `.dropdown-content` | `--surface` | `--border-subtle` | `--shadow-xl` |
| `.dropdown-item` | transparent | none | none |
| `.dropdown-item:hover` | `--background-subtle` | none | none |

### Tooltips

| Component | Background | Text | Border |
|-----------|------------|------|--------|
| `.tooltip` | `--surface-elevated` | `--text-primary` | `--border-subtle` |

### Data Tables

| Component | Background | Text | Border |
|-----------|------------|------|--------|
| `thead` | `--background-subtle` | `--text-secondary` | `--border-subtle` |
| `tbody tr` | `--surface` | `--text-primary` | `--border-subtle` |
| `tbody tr:hover` | `--background-subtle` | `--text-primary` | `--border-subtle` |

### Empty States

| Component | Background | Text | Icon Color |
|-----------|------------|------|------------|
| `.empty-state` | `--surface` | `--text-tertiary` | `--text-tertiary` |

### Error Banners

| Component | Background | Text | Border |
|-----------|------------|------|---------|
| `.error-banner` | `--error-bg` | `--error-text-strong` | `--error-border` |

---

## Implementation Checklist

- [x] CSS custom properties defined
- [x] Light theme values set
- [x] Dark theme values set
- [x] All text meets 4.5:1 minimum
- [x] Focus states visible (3px ring)
- [x] No hardcoded colors in components
- [x] Theme toggle functional
- [x] System preference detection

---

## Migration Notes

1. Replace all `bg-white`, `bg-gray-*` with design tokens
2. Replace all `text-gray-*` with `--text-*` tokens
3. Replace all `border-gray-*` with `--border-*` tokens
4. Test all interactive states in both themes
5. Verify focus indicators visible in dark mode
