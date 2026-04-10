import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const sourcePng = path.join(root, 'src', 'assets', 'corelignLogo512.png')
const iconDir = path.join(root, 'build')
const targetIco = path.join(iconDir, 'icon.ico')
const targetPng = path.join(iconDir, 'icon.png')

async function main() {
  await mkdir(iconDir, { recursive: true })
  const input = await readFile(sourcePng)
  const ico = await pngToIco(input)
  await writeFile(targetIco, ico)
  await writeFile(targetPng, input)
  console.log(`Generated icon: ${targetIco}`)
  console.log(`Generated icon: ${targetPng}`)
}

main().catch((error) => {
  console.error('Failed to generate icon:', error)
  process.exit(1)
})
