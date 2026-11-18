import { WeddingTheme } from '../types/wedding';

/**
 * Color and luminance utilities for accessible contrast across light and dark wedding themes.
 */

function parseColorToRgb(str: string): { r: number; g: number; b: number } | null {
  const trimmed = str.trim();

  // 6-digit hex
  const hex6 = trimmed.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
  if (hex6) {
    return {
      r: parseInt(hex6[1], 16),
      g: parseInt(hex6[2], 16),
      b: parseInt(hex6[3], 16),
    };
  }

  // 3-digit hex
  const hex3 = trimmed.match(/^#?([a-f\d])([a-f\d])([a-f\d])/i);
  if (hex3) {
    return {
      r: parseInt(hex3[1] + hex3[1], 16),
      g: parseInt(hex3[2] + hex3[2], 16),
      b: parseInt(hex3[3] + hex3[3], 16),
    };
  }

  // rgb / rgba
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return null;
}

export function isColorDark(colorString?: string): boolean {
  if (!colorString) return false;
  const str = colorString.trim();

  // If gradient, inspect all embedded colors (hex & rgb)
  if (str.includes('gradient')) {
    const hexColors = str.match(/#[a-f\d]{3,6}/gi) || [];
    const rgbColors = str.match(/rgba?\s*\([^)]+\)/gi) || [];
    const allMatches = [...hexColors, ...rgbColors];

    if (allMatches.length > 0) {
      let totalLuminance = 0;
      let validCount = 0;
      for (const match of allMatches) {
        const rgb = parseColorToRgb(match);
        if (rgb) {
          const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
          totalLuminance += lum;
          validCount++;
        }
      }
      if (validCount > 0) {
        return (totalLuminance / validCount) < 0.55;
      }
    }
  }

  const rgb = parseColorToRgb(str);
  if (rgb) {
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance < 0.55;
  }

  return false;
}

/**
 * Checks if a wedding theme has a dark visual atmosphere, either on the overall
 * background canvas or on the card containers.
 */
export function isThemeOrBackgroundDark(theme: WeddingTheme): boolean {
  return (
    isColorDark(theme.colors.background) ||
    isColorDark(theme.colors.backgroundGradient) ||
    isColorDark(theme.colors.cardBg)
  );
}

/**
 * Resolves the optimal font color for timing text.
 * When the background is dark, ensures a light, bright, vibrant color matching the theme
 * (such as glowing gold, vibrant champagne, or bright theme secondary).
 */
export function getThemeTimingColor(theme: WeddingTheme): string {
  const isDark = isThemeOrBackgroundDark(theme);
  if (!isDark) {
    return theme.colors.primary;
  }

  // When dark: check theme's gold/metallic first if bright
  if (theme.colors.goldOrMetallic && !isColorDark(theme.colors.goldOrMetallic)) {
    return theme.colors.goldOrMetallic;
  }

  // Check secondary if bright
  if (theme.colors.secondary && !isColorDark(theme.colors.secondary)) {
    return theme.colors.secondary;
  }

  // Check accent if bright
  if (theme.colors.accent && !isColorDark(theme.colors.accent)) {
    return theme.colors.accent;
  }

  // Fallback: luminous bright wedding gold
  return '#FDE68A';
}

/**
 * Resolves the optimal font color for address / location text.
 * When the background is dark, ensures high-contrast light text matching the theme
 * so addresses never appear dark or unreadable.
 */
export function getThemeAddressColor(theme: WeddingTheme): string {
  const isDark = isThemeOrBackgroundDark(theme);
  if (!isDark) {
    return theme.colors.textBody || '#44403C';
  }

  // Check if theme's textBody is already light
  if (theme.colors.textBody && !isColorDark(theme.colors.textBody)) {
    return theme.colors.textBody;
  }

  // Check if theme's textMuted is light
  if (theme.colors.textMuted && !isColorDark(theme.colors.textMuted)) {
    return theme.colors.textMuted;
  }

  // High-contrast clean off-white / light silver
  return 'rgba(255, 255, 255, 0.92)';
}

/**
 * Resolves the optimal font color for date & venue headings on cards.
 */
export function getThemeHeadingColor(theme: WeddingTheme): string {
  const isDark = isThemeOrBackgroundDark(theme);
  if (!isDark) {
    return theme.colors.textHeading;
  }

  if (theme.colors.textHeading && !isColorDark(theme.colors.textHeading)) {
    return theme.colors.textHeading;
  }

  return '#FFFFFF';
}

/**
 * Resolves the label text color (e.g. "DATE & TIMING", "LOCATION & VENUE")
 */
export function getThemeLabelColor(theme: WeddingTheme): string {
  const isDark = isThemeOrBackgroundDark(theme);
  if (!isDark) {
    return theme.colors.textMuted || '#78716C';
  }

  if (theme.colors.goldOrMetallic && !isColorDark(theme.colors.goldOrMetallic)) {
    return theme.colors.goldOrMetallic;
  }

  return '#FDE68A';
}

