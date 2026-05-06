export function shortPosition(pos: string) {
  return pos.match(/\(([^)]+)\)/)?.[1] || pos
}
