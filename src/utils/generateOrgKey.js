// src/utils/generateOrgKey.js
// Generates a short, readable, universally unique key: ET-XXXX-XXXX-XXXX
import { v4 as uuidv4 } from 'uuid'

export function generateOrgKey() {
  // Use uuid then take chars to form readable segments
  const raw = uuidv4().replace(/-/g, '').toUpperCase()
  const a = raw.slice(0, 4)
  const b = raw.slice(4, 8)
  const c = raw.slice(8, 12)
  return `ET-${a}-${b}-${c}`
}

// Validate format
export function isValidOrgKey(key) {
  return /^ET-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)
}
