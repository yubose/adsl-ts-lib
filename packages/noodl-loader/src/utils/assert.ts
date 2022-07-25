export function assertNonEmpty(value: unknown, name: string) {
  if (!value) throw new Error(`"${name}" cannot be empty`)
}
