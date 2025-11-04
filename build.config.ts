import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/client/record',
    'src/client/listeners',
    'src/client/overlay',
    'src/client/vite-devtools',
  ],
  declaration: 'node16',
  clean: true,
  rollup: {
    inlineDependencies: [
      'nanoevents',
      'pathe',
    ],
  },
  externals: [
    '@vitejs/devtools-kit',
  ],
  hooks: {
    'rollup:dts:options': (ctx, options) => {
      options.plugins = options.plugins.filter(i => i?.name !== 'commonjs')
    },
  },
})
