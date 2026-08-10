import { dirname, isAbsolute, relative } from 'pathe'

/**
 * Resolve the module specifier used to import the tracer's `record` entry from
 * within a transformed module.
 *
 * For real files we compute a relative path from the module's directory. But
 * virtual modules (e.g. Nuxt's `virtual:nuxt:...` layouts, or `\0`-prefixed
 * Rollup virtuals) have no real filesystem base, so `dirname(id)` collapses to
 * `.` and the relative import cannot be resolved from them. Vite 7 papered over
 * this by falling back to the CWD; Vite 8 no longer does, so the injected
 * import fails. For those IDs we fall back to the fully-resolved absolute path
 * of the record module, which resolves regardless of the module's base.
 * See https://github.com/nuxt/devtools/issues/1051.
 */
export function getRecordImportPath(
  id: string,
  pathRecordDist: string,
  resolveRecordEntryPath: boolean,
): string {
  if (!resolveRecordEntryPath)
    return 'vite-plugin-vue-tracer/client/record'
  // Virtual modules have no real filesystem base to be relative to.
  if (id.startsWith('virtual:') || id.startsWith('\0'))
    return pathRecordDist
  let related = relative(dirname(id), pathRecordDist)
  if (!related.startsWith('./') && !isAbsolute(related))
    related = `./${related}`
  return related
}
