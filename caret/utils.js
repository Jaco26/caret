export function randId() {
  const chars = 'abcdef0123456789'
  let rv = ''
  for (let i = 0; i < 6; i++) {
    rv += chars[Math.floor(Math.random() * chars.length)]
  }
  return rv
}