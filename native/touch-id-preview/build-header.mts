import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { themeHeader } from './theme.mts'
import { createFingerprintNativeHeader } from './native.mts'

const outputDirectory = process.argv[2]
if (!outputDirectory)
  throw new Error('Usage: build-header.mts OUTPUT_DIRECTORY')
mkdirSync(outputDirectory, { recursive: true })
const svg = readFileSync(
  new URL('./assets/geometry.svg', import.meta.url),
  'utf8',
)
const flow = JSON.parse(
  readFileSync(new URL('./assets/flow.json', import.meta.url), 'utf8'),
)
writeFileSync(
  path.join(outputDirectory, 'fingerprint-animation.generated.h'),
  createFingerprintNativeHeader(svg, flow),
)

writeFileSync(path.join(outputDirectory, 'theme.generated.h'), themeHeader())
