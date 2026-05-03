/**
 * Generate a bcrypt hash for the admin password.
 * Usage: npx tsx scripts/gen-admin-hash.ts
 * Then set ADMIN_PASSWORD_HASH=<output> in your .env
 */
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question('Admin password: ', async (password) => {
  rl.close()
  if (password.length < 12) {
    console.error('Error: password must be at least 12 characters')
    process.exit(1)
  }
  const hash = await bcrypt.hash(password, 12)
  console.log('\nAdd to your .env:\n')
  console.log(`ADMIN_PASSWORD_HASH=${hash}`)
})
