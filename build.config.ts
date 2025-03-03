import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/client/record',
    'src/client/listeners',
    'src/client/overlay',
    'src/client/vue-inspector-compat',
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
