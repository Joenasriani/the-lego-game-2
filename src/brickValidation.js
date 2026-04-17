const HEX_COLOR_RE = /^#([0-9a-fA-F]{6})$/

export const STORAGE_KEY = 'lego-build'
export const MAX_BRICKS = 5000
export const MAX_FILE_SIZE_BYTES = 1024 * 1024
export const POSITION_LIMITS = {
  minX: -100,
  maxX: 100,
  minY: 0,
  maxY: 100,
  minZ: -100,
  maxZ: 100,
}

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)

function validatePosition(position, index) {
  if (!Array.isArray(position) || position.length !== 3) {
    throw new Error(`Brick ${index + 1}: position must be an array of [x, y, z].`)
  }

  const [x, y, z] = position
  if (![x, y, z].every(Number.isInteger)) {
    throw new Error(`Brick ${index + 1}: position values must be integers.`)
  }

  if (x < POSITION_LIMITS.minX || x > POSITION_LIMITS.maxX) {
    throw new Error(`Brick ${index + 1}: x must be between ${POSITION_LIMITS.minX} and ${POSITION_LIMITS.maxX}.`)
  }
  if (y < POSITION_LIMITS.minY || y > POSITION_LIMITS.maxY) {
    throw new Error(`Brick ${index + 1}: y must be between ${POSITION_LIMITS.minY} and ${POSITION_LIMITS.maxY}.`)
  }
  if (z < POSITION_LIMITS.minZ || z > POSITION_LIMITS.maxZ) {
    throw new Error(`Brick ${index + 1}: z must be between ${POSITION_LIMITS.minZ} and ${POSITION_LIMITS.maxZ}.`)
  }
}

export function validateBrick(brick, index) {
  if (!brick || typeof brick !== 'object' || Array.isArray(brick)) {
    throw new Error(`Brick ${index + 1}: brick must be an object.`)
  }

  if (typeof brick.id !== 'string' || brick.id.trim().length === 0 || brick.id.length > 100) {
    throw new Error(`Brick ${index + 1}: id must be a non-empty string up to 100 characters.`)
  }

  validatePosition(brick.position, index)

  if (typeof brick.color !== 'string' || !HEX_COLOR_RE.test(brick.color)) {
    throw new Error(`Brick ${index + 1}: color must be a valid 6-digit hex value like #ef4444.`)
  }

  if (!isFiniteNumber(brick.rotation) || brick.rotation < -Math.PI * 2 || brick.rotation > Math.PI * 2) {
    throw new Error(`Brick ${index + 1}: rotation must be a finite number between -2π and 2π.`)
  }

  return {
    id: brick.id,
    position: [...brick.position],
    color: brick.color,
    rotation: brick.rotation,
  }
}

export function validateBuildPayload(payload) {
  if (!Array.isArray(payload)) {
    throw new Error('Build data must be an array of bricks.')
  }

  if (payload.length > MAX_BRICKS) {
    throw new Error(`Build exceeds the ${MAX_BRICKS} brick limit.`)
  }

  const validated = payload.map((brick, index) => validateBrick(brick, index))

  const uniquePositions = new Set()
  validated.forEach((brick, index) => {
    const key = brick.position.join(',')
    if (uniquePositions.has(key)) {
      throw new Error(`Brick ${index + 1}: duplicate position ${key} is not allowed.`)
    }
    uniquePositions.add(key)
  })

  return validated
}

export function parseImportText(text, fileSize = 0) {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Import file is too large. Maximum size is ${Math.floor(MAX_FILE_SIZE_BYTES / 1024)}KB.`)
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`)
  }

  return validateBuildPayload(parsed)
}
