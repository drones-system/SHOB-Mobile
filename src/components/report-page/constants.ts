import { Platform } from 'react-native';

export const Colors = {
  bgDeep: '#0A0018',
  bgCard: '#26193A',
  accent: '#E9D3FF',
  accentSoft: '#C387FF',
  accentBlue: '#4084FF',
  danger: '#DA372E',
  dangerSoft: 'rgba(220, 55, 46, 0.15)',
  white: '#FFFFFF',
  textMuted: 'rgba(233, 211, 255, 0.55)',
  inputBorder: 'rgba(195, 135, 255, 0.25)',
  successGreen: '#4CAF50',
  successSoft: 'rgba(76, 175, 80, 0.15)',
  sensorActive: 'rgba(64, 132, 255, 0.15)',
  sensorBorder: 'rgba(64, 132, 255, 0.4)',
} as const;

export const FontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });
