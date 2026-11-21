export const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

export function multiply(m, n) {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  }
}

export function translate(x, y) {
  return { a: 1, b: 0, c: 0, d: 1, e: x, f: y }
}

export function scale(sx, sy = sx) {
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }
}

export function rotate(deg, cx = 0, cy = 0) {
  const r = (deg * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const rot = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }
  return multiply(multiply(translate(cx, cy), rot), translate(-cx, -cy))
}

export function apply(m, x, y) {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

const NUMBER = /-?(?:\d+\.\d+|\d+|\.\d+)(?:e[-+]?\d+)?/gi

function parseTransformList(text) {
  if (!text) return IDENTITY
  const fn = /(translate|scale|rotate|matrix)\s*\(([^)]*)\)/g
  let m = IDENTITY
  let match
  const steps = []
  while ((match = fn.exec(text))) {
    const nums = (match[2].match(NUMBER) || []).map(Number)
    const name = match[1]
    if (name === 'translate') steps.push(translate(nums[0] || 0, nums[1] || 0))
    else if (name === 'scale') steps.push(scale(nums[0] || 1, nums[1] ?? nums[0] ?? 1))
    else if (name === 'rotate') steps.push(rotate(nums[0] || 0, nums[1] || 0, nums[2] || 0))
    else if (name === 'matrix' && nums.length >= 6) {
      steps.push({ a: nums[0], b: nums[1], c: nums[2], d: nums[3], e: nums[4], f: nums[5] })
    }
  }
  for (const step of steps) m = multiply(m, step)
  return m
}

export function parseTransform(text) {
  return parseTransformList(text)
}

const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }

function tokenize(d) {
  const tokens = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.\d+|\d+|\.\d+)(?:e[-+]?\d+)?)/g
  let match
  while ((match = re.exec(d))) {
    if (match[1]) tokens.push(match[1])
    else tokens.push(Number(match[2]))
  }
  const commands = []
  let i = 0
  while (i < tokens.length) {
    const raw = tokens[i]
    if (typeof raw !== 'string') break
    i += 1
    const upper = raw.toUpperCase()
    const arity = ARITY[upper]
    const args = []
    while (i < tokens.length && typeof tokens[i] === 'number') {
      args.push(tokens[i])
      i += 1
    }
    if (arity === 0) {
      commands.push({ c: raw, a: [] })
      continue
    }
    for (let k = 0; k < args.length; k += arity) {
      const slice = args.slice(k, k + arity)
      if (slice.length < arity) break
      let c = raw
      if (k > 0 && (raw === 'M' || raw === 'm')) c = raw === 'M' ? 'L' : 'l'
      commands.push({ c, a: slice })
    }
  }
  return commands
}

function toAbsolute(commands) {
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  let prevCx = 0
  let prevCy = 0
  const out = []
  for (const cmd of commands) {
    const c = cmd.c
    const rel = c === c.toLowerCase()
    const op = c.toUpperCase()
    const a = cmd.a
    const abs = (i, base) => (rel ? a[i] + base : a[i])
    if (op === 'M') {
      x = abs(0, x)
      y = abs(1, y)
      sx = x
      sy = y
      prevCx = x
      prevCy = y
      out.push({ c: 'M', a: [x, y] })
    } else if (op === 'L') {
      x = abs(0, x)
      y = abs(1, y)
      prevCx = x
      prevCy = y
      out.push({ c: 'L', a: [x, y] })
    } else if (op === 'H') {
      x = abs(0, x)
      prevCx = x
      prevCy = y
      out.push({ c: 'L', a: [x, y] })
    } else if (op === 'V') {
      y = abs(0, y)
      prevCx = x
      prevCy = y
      out.push({ c: 'L', a: [x, y] })
    } else if (op === 'C') {
      const x1 = abs(0, x)
      const y1 = abs(1, y)
      const x2 = abs(2, x)
      const y2 = abs(3, y)
      x = abs(4, x)
      y = abs(5, y)
      prevCx = x2
      prevCy = y2
      out.push({ c: 'C', a: [x1, y1, x2, y2, x, y] })
    } else if (op === 'S') {
      const x1 = 2 * x - prevCx
      const y1 = 2 * y - prevCy
      const x2 = abs(0, x)
      const y2 = abs(1, y)
      x = abs(2, x)
      y = abs(3, y)
      prevCx = x2
      prevCy = y2
      out.push({ c: 'C', a: [x1, y1, x2, y2, x, y] })
    } else if (op === 'Q') {
      const x1 = abs(0, x)
      const y1 = abs(1, y)
      x = abs(2, x)
      y = abs(3, y)
      prevCx = x1
      prevCy = y1
      out.push({ c: 'Q', a: [x1, y1, x, y] })
    } else if (op === 'T') {
      const x1 = 2 * x - prevCx
      const y1 = 2 * y - prevCy
      x = abs(0, x)
      y = abs(1, y)
      prevCx = x1
      prevCy = y1
      out.push({ c: 'Q', a: [x1, y1, x, y] })
    } else if (op === 'Z') {
      x = sx
      y = sy
      prevCx = x
      prevCy = y
      out.push({ c: 'Z', a: [] })
    } else if (op === 'A') {
      x = abs(5, x)
      y = abs(6, y)
      prevCx = x
      prevCy = y
      out.push({ c: 'L', a: [x, y] })
    }
  }
  return out
}

function fmt(n) {
  const r = Math.round(n * 1000) / 1000
  return String(r)
}

export function transformPath(d, matrix) {
  const abs = toAbsolute(tokenize(d))
  let s = ''
  for (const cmd of abs) {
    if (cmd.c === 'Z') {
      s += 'Z '
      continue
    }
    const pts = []
    for (let i = 0; i < cmd.a.length; i += 2) {
      const p = apply(matrix, cmd.a[i], cmd.a[i + 1])
      pts.push(`${fmt(p.x)} ${fmt(p.y)}`)
    }
    s += `${cmd.c} ${pts.join(' ')} `
  }
  return s.trim()
}

export function pathBounds(d) {
  const abs = toAbsolute(tokenize(d))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const cmd of abs) {
    for (let i = 0; i < cmd.a.length; i += 2) {
      const x = cmd.a[i]
      const y = cmd.a[i + 1]
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
