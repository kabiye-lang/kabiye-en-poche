const _appearances = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
} as const
export type Appearance = keyof typeof _appearances
