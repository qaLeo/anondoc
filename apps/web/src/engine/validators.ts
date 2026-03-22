/** Validates INN (10 or 12 digits) checksum */
export function validateINN(digits: string): boolean {
  if (digits.length === 10) {
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8]
    const sum = weights.reduce((acc, w, i) => acc + w * parseInt(digits[i]), 0)
    return (sum % 11) % 10 === parseInt(digits[9])
  }
  if (digits.length === 12) {
    const w1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
    const w2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
    const c1 = (w1.reduce((acc, w, i) => acc + w * parseInt(digits[i]), 0) % 11) % 10
    const c2 = (w2.reduce((acc, w, i) => acc + w * parseInt(digits[i]), 0) % 11) % 10
    return c1 === parseInt(digits[10]) && c2 === parseInt(digits[11])
  }
  return false
}

/** Validates SNILS checksum */
export function validateSNILS(digits: string): boolean {
  if (digits.length !== 11) return false
  const num = parseInt(digits.slice(0, 9))
  if (num <= 1001998) return true // special cases
  const weights = [9, 8, 7, 6, 5, 4, 3, 2, 1]
  let sum = weights.reduce((acc, w, i) => acc + w * parseInt(digits[i]), 0)
  while (sum > 101) sum = Math.floor(sum / 10) + (sum % 10)
  const checksum = sum === 100 || sum === 101 ? 0 : sum
  return checksum === parseInt(digits.slice(9))
}

/** Luhn algorithm for card numbers */
export function validateLuhn(digits: string): boolean {
  let sum = 0
  let alternate = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i])
    if (alternate) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}
