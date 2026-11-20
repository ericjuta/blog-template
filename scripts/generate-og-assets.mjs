import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { deflateSync } from "node:zlib"
import { SITE_NAME, SITE_ORIGIN } from "../src/lib/site.ts"

// Seven two-digit hex row masks per glyph, with the leftmost pixel in bit 4.
const font = {
  A: "0e11111f111111", B: "1e11111e11111e", C: "0e11101010110e",
  D: "1e11111111111e", E: "1f10101e10101f", F: "1f10101e101010",
  G: "0e11101711110f", H: "1111111f111111", I: "0e04040404040e",
  J: "0702020212120c", K: "11121418141211", L: "1010101010101f",
  M: "111b1515111111", N: "11191915131311", O: "0e11111111110e",
  P: "1e11111e101010", Q: "0e11111115120d", R: "1e11111e141211",
  S: "0f10100e01011e", T: "1f040404040404", U: "1111111111110e",
  V: "11111111110a04", W: "11111115151b11", X: "11110a040a1111",
  Y: "11110a04040404", Z: "1f01020408101f",
  a: "00000e010f110f", b: "10101e1111111e", c: "00000f1010100f",
  d: "01010f1111110f", e: "00000e111f100e", f: "0609081c080808",
  g: "00000f11110f1e", h: "10101e11111111", i: "04000c0404040e",
  j: "0200060202120c", k: "101011121c1211", l: "0c04040404040e",
  m: "00001a15151515", n: "00001e11111111", o: "00000e1111110e",
  p: "00001e111e1010", q: "00000f110f0101", r: "00001619101010",
  s: "00000f100e011e", t: "08081c08080906", u: "0000111111130d",
  v: "00001111110a04", w: "0000111115150a", x: "0000110a040a11",
  y: "000011110f011e", z: "00001f0204081f",
  0: "0e11131519110e", 1: "040c040404040e", 2: "0e11010204081f",
  3: "1e01010601111e", 4: "02060a121f0202", 5: "1f101e0101110e",
  6: "0608101e11110e", 7: "1f010204080808", 8: "0e11110e11110e",
  9: "0e11110f01020c",
  " ": "00000000000000", ".": "00000000000c0c", ",": "00000000000c08",
  ":": "00000c0c000c0c", ";": "00000c0c000c08", "-": "0000001f000000",
  "_": "0000000000001f", "'": "0c080000000000", '"': "0a0a0000000000",
  "!": "04040404040004", "?": "0e110102040004", "%": "19190204081313",
  "/": "01010204081010", "\\": "10100804020101", "·": "0000000c0c0000",
  "(": "02040808080402", ")": "08040202020408", "&": "0c12140d12120d",
  "+": "0004041f040400", "=": "00001f001f0000", "#": "000a1f0a1f0a00",
  "@": "0e11171517100e", "|": "04040404040404", "…": "00000000001500",
}
const glyphs = new Map(Object.entries(font).map(([character, rows]) => [character, Buffer.from(rows, "hex")]))

const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  for (let bit = 0; bit < 8; bit++) byte = (byte >>> 1) ^ (byte & 1 ? 0xedb88320 : 0)
  return byte
})

function chunk(type, payload = Buffer.alloc(0)) {
  const bytes = Buffer.alloc(payload.length + 12)
  bytes.writeUInt32BE(payload.length, 0)
  bytes.write(type, 4, "ascii")
  payload.copy(bytes, 8)
  let crc = 0xffffffff
  for (let i = 4; i < bytes.length - 4; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 255]
  bytes.writeUInt32BE((crc ^ 0xffffffff) >>> 0, bytes.length - 4)
  return bytes
}

const BACKGROUND = 0x0a0a0a
const WHITE = 0xffffff
const BLUE = 0x0070f3

function canvas(width, height) {
  // RGB scanlines with a zero filter byte (None) before each row.
  const stride = 1 + width * 3
  const pixels = Buffer.alloc(stride * height)
  function rect(x, y, w, h, color) {
    const rgb = Buffer.from([color >>> 16, (color >>> 8) & 255, color & 255])
    const left = Math.max(0, x)
    const right = Math.min(width, x + w)
    if (left >= right) return
    for (let row = Math.max(0, y); row < Math.min(height, y + h); row++) {
      const start = row * stride + 1
      pixels.fill(rgb, start + left * 3, start + right * 3)
    }
  }
  function text(value, x, y, scale, color, weight = 0) {
    for (const character of value) {
      const glyph = glyphs.get(character) ?? glyphs.get("?")
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row] & (16 >> col)) {
            rect(x + col * scale, y + row * scale, scale + weight, scale, color)
          }
        }
      }
      x += 6 * scale
    }
  }
  function png() {
    const header = Buffer.alloc(13)
    header.writeUInt32BE(width, 0)
    header.writeUInt32BE(height, 4)
    header[8] = 8 // Bit depth
    header[9] = 2 // Truecolor RGB
    return Buffer.concat([
      Buffer.from("89504e470d0a1a0a", "hex"),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(pixels, { level: 9 })),
      chunk("IEND"),
    ])
  }
  rect(0, 0, width, height, BACKGROUND)
  return { rect, text, png }
}

function wrap(value, columns, maxLines) {
  const normalized = value.normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
  const words = normalized.trim().split(/\s+/u)
  const lines = []
  let line = ""
  for (const word of words) {
    let rest = Array.from(word, (character) => glyphs.has(character) ? character : "?").join("")
    if (line && line.length + 1 + rest.length > columns) {
      lines.push(line)
      line = ""
    }
    while (rest.length > columns) {
      lines.push(rest.slice(0, columns))
      rest = rest.slice(columns)
    }
    line = line ? `${line} ${rest}` : rest
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, columns - 1).trimEnd()}…`
  }
  return lines
}

const accents = new Map([
  ["Technical report", 0x69aaff],
  ["Case study", 0x5ce0b1],
  ["Research", 0xd7a8ff],
])

function postCard(post) {
  const image = canvas(1200, 630)
  const { rect, text } = image
  const accent = accents.get(post.category) ?? 0x69aaff
  for (let x = 0; x < 1200; x += 48) rect(x, 0, 1, 630, 0x191919)
  for (let y = 0; y < 630; y += 48) rect(0, y, 1200, 1, 0x191919)
  rect(0, 0, 1200, 12, accent)

  const [category = ""] = wrap(post.category.toUpperCase(), 56, 1)
  const pillWidth = category.length * 18 + 36
  const radius = 21
  for (let row = 0; row < 2 * radius; row++) {
    const dy = row + 0.5 - radius
    const inset = radius - Math.floor(Math.sqrt(radius ** 2 - dy ** 2))
    rect(72 + inset, 58 + row, pillWidth - 2 * inset, 1, accent)
  }
  text(category, 90, 69, 3, BACKGROUND)

  const titles = wrap(post.title, 25, 3)
  titles.forEach((line, i) => text(line, 72, 139 + i * 63, 7, WHITE, 2))
  const subtitleTop = 159 + titles.length * 63
  wrap(post.subtitle, 58, 4).forEach((line, i) => text(line, 72, subtitleTop + i * 31, 3, 0xc2c2c2))

  rect(72, 545, 1056, 1, 0x404040)
  const footerHost = new URL(SITE_ORIGIN).host
  const [footer = ""] = wrap(`${SITE_NAME.toUpperCase()} · ${footerHost}`, 58, 1)
  text(footer, 72, 571, 3, 0xc2c2c2)
  return image.png()
}

export function generateOgAssets(distDir, posts) {
  const ogDir = join(distDir, "og")
  mkdirSync(ogDir, { recursive: true })
  const icon = canvas(180, 180)
  icon.rect(0, 0, 180, 12, BLUE)
  icon.text("REA", 22, 62, 8, WHITE)
  writeFileSync(join(distDir, "apple-touch-icon.png"), icon.png())

  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error(`Invalid OG slug: ${post.slug}`)
    writeFileSync(join(ogDir, `${post.slug}.png`), postCard(post))
  }
}
