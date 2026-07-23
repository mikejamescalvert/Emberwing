// Dragon colour palettes for the start-screen picker. Pure data + a lookup.
// Each palette provides the three material colours the dragon builder needs.

export const DRAGON_COLORS = {
  red: { name: 'Ember', scale: 0x9c2f2f, belly: 0xe0a441, wing: 0x5c1f1f },
  green: { name: 'Moss', scale: 0x2f7d4f, belly: 0x9ccc65, wing: 0x1b5e3a },
  blue: { name: 'Frost', scale: 0x2f4f9c, belly: 0x88c0ff, wing: 0x1f2f5c },
  black: { name: 'Onyx', scale: 0x2b2b33, belly: 0x565663, wing: 0x1a1a22 },
  white: { name: 'Bone', scale: 0xdadae2, belly: 0xf2e8d5, wing: 0xb2b2c2 },
  brown: { name: 'Clay', scale: 0x6f4e2f, belly: 0xd9b48a, wing: 0x4e3620 },
};

// Display order for the picker (also the six keys, in UI order).
export const DRAGON_COLOR_ORDER = ['red', 'green', 'blue', 'black', 'white', 'brown'];

export const DEFAULT_COLOR = 'red';

/** Look up a palette by key; unknown keys fall back to the default. */
export function getPalette(name) {
  return DRAGON_COLORS[name] || DRAGON_COLORS[DEFAULT_COLOR];
}
