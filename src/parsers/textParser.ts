/** Parse text file with UTF-8 / windows-1251 fallback */
export async function parseTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1251').decode(buffer)
  }
}
