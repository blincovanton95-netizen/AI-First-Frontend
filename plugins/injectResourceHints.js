/**
 * Инжектирует preload/prefetch для хешированных чанков после production-сборки.
 */
export function injectResourceHints() {
  return {
    name: 'inject-resource-hints',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html

      const hints = []

      for (const chunk of Object.values(ctx.bundle)) {
        if (chunk.type === 'chunk' && /CryptoCard/i.test(chunk.fileName)) {
          hints.push(
            `<link rel="prefetch" href="/${chunk.fileName}" as="script" crossorigin>`
          )
        }
        if (chunk.type === 'asset' && /CryptoCard/i.test(chunk.fileName) && chunk.fileName.endsWith('.css')) {
          hints.push(
            `<link rel="prefetch" href="/${chunk.fileName}" as="style">`
          )
        }
        if (chunk.type === 'asset' && /index-.*\.css$/.test(chunk.fileName)) {
          hints.push(
            `<link rel="preload" href="/${chunk.fileName}" as="style">`
          )
        }
      }

      if (!hints.length) return html
      return html.replace('</title>', `</title>\n  ${hints.join('\n  ')}`)
    },
  }
}
