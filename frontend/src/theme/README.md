# UI Theme

A reusable design system extracted from the portfolio project. Includes CSS design tokens (light & dark), a Tailwind CSS preset, a React theme provider, and utility classes.

## What's Inside

| File                  | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `theme.css`           | CSS custom properties (colors, shadows, gradients), keyframes, utility classes |
| `tailwind-preset.ts`  | Tailwind preset mapping CSS variables to semantic tokens |
| `ThemeProvider.tsx`    | React context — dark / light / system with localStorage  |
| `ThemeToggle.tsx`      | Cycle button (light → dark → system)                     |
| `utils.ts`            | `cn()` — clsx + tailwind-merge                           |
| `index.ts`            | Barrel exports                                           |

## Quick Setup

### 1. Copy the `theme/` folder into your project

```bash
cp -r theme/ /path/to/your-project/src/theme
```

### 2. Install peer dependencies

```bash
npm install clsx tailwind-merge lucide-react tailwindcss-animate
```

### 3. Import the CSS variables

In your main CSS file (e.g. `src/index.css`), import the theme **before** Tailwind directives:

```css
@import './theme/theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}
```

### 4. Use the Tailwind preset

In your `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";
import themePreset from "./src/theme/tailwind-preset";

export default {
  ...themePreset,
  content: [
    "./src/**/*.{ts,tsx}",
    // ...your content paths
  ],
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 5. Wrap your app with the ThemeProvider

```tsx
import { ThemeProvider, ThemeToggle } from "./theme";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <header>
        <ThemeToggle />
      </header>
      {/* ... */}
    </ThemeProvider>
  );
}
```

## Design Tokens

### Colors

| Token         | Light                  | Dark                   |
| ------------- | ---------------------- | ---------------------- |
| `primary`     | `hsl(24 100% 42%)` (orange) | `hsl(24 100% 55%)` |
| `background`  | `hsl(0 0% 100%)`      | `hsl(0 0% 4%)`        |
| `foreground`  | `hsl(0 0% 3%)`        | `hsl(0 0% 98%)`       |
| `card`        | `hsl(0 0% 100%)`      | `hsl(0 0% 6%)`        |
| `secondary`   | `hsl(0 0% 96%)`       | `hsl(0 0% 12%)`       |
| `muted`       | `hsl(0 0% 96%)`       | `hsl(0 0% 12%)`       |
| `border`      | `hsl(0 0% 85%)`       | `hsl(0 0% 14%)`       |
| `destructive` | `hsl(0 84% 50%)`      | `hsl(0 62% 30%)`      |

### Typography

- **Font**: Cabinet Grotesk (loaded from Fontshare)
- **Fallback**: system-ui, sans-serif

### Radius

`--radius: 0.75rem` — used via `rounded-lg`, `rounded-md`, `rounded-sm`

### Shadows

- `shadow-card` — subtle card shadow (adapts to dark mode)
- `shadow-elevated` — prominent elevated shadow

### Gradients

- `--gradient-primary` — 135deg orange gradient
- `--gradient-subtle` — vertical subtle background gradient

## Utility Classes

| Class              | Effect                                     |
| ------------------ | ------------------------------------------ |
| `.bg-grid`         | 40px grid background using border color    |
| `.gradient-overlay` | Radial primary-tinted overlay             |
| `.animate-fade-in` | Fade in + slide up (20px)                  |
| `.animate-fade-in-up` | Fade in + slide up (30px)               |
| `.animate-slide-in-left` | Slide in from left                   |
| `.animate-float`   | Gentle infinite float                      |
| `.stagger-children` | Auto-stagger child fade-in (100ms steps)  |
| `.link-hover`      | Underline-on-hover effect                  |
| `.card-hover`      | Lift + elevated shadow on hover            |
| `.btn-glow`        | Primary-tinted glow on hover               |

## Using `cn()` for Class Merging

```tsx
import { cn } from "./theme";

<div className={cn("rounded-lg bg-card p-4", isActive && "border-primary")} />
```

## Using `useTheme` Hook

```tsx
import { useTheme } from "./theme";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // theme: "dark" | "light" | "system"
  // resolvedTheme: "dark" | "light" (actual computed value)
}
```
