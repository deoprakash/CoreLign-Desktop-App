import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const sourcePng = path.join(root, 'src', 'assets', 'corelignLogo.png')
const iconDir = path.join(root, 'build')
const targetIco = path.join(iconDir, 'icon.ico')

async function main() {
  await mkdir(iconDir, { recursive: true })
  const input = await readFile(sourcePng)
  const ico = await pngToIco(input)
  await writeFile(targetIco, ico)
  console.log(`Generated icon: ${targetIco}`)
}

main().catch((error) => {
  console.error('Failed to generate icon:', error)
  process.exit(1)
})
