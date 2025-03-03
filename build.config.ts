import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/client/record',
    'src/client/listeners',
    'src/client/overlay',
  ],
  declaration: 'node16',
  clean: true,
  rollup: {
    inlineDependencies: [
      'nanoevents',
      'pathe',
    ],
  },
  hooks: {
    'rollup:dts:options': (ctx, options) => {
      // @ts-expect-error - remove commonjs plugin
      options.plugins = options.plugins.filter(i => i?.name !== 'commonjs')
    },
  },
})
