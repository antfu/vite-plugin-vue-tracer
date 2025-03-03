import { colors } from '@unocss/preset-mini/colors'
import { defineConfig, presetAttributify, presetWind } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetAttributify(),
  ],
  theme: {
    colors: {
      primary: colors.blue,
      secondary: colors.orange,
    },
  },
})
