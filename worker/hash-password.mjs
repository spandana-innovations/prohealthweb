#!/usr/bin/env node
/* Turn a password into a PBKDF2 hash for ADMIN_PASS_HASH.
   Usage:  node hash-password.mjs "my new password"
   Then:   wrangler secret put ADMIN_PASS_HASH     (paste the output)          */
import crypto from 'crypto';
const pass = process.argv[2];
if (!pass) { console.error('Usage: node hash-password.mjs "your password"'); process.exit(1); }
if (pass.length < 12) console.error('WARNING: shorter than 12 characters. Consider a longer passphrase.\n');
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(pass, salt, 100000, 32, 'sha256').toString('hex');
console.log('\nADMIN_PASS_HASH value (copy the whole line):\n');
console.log(`pbkdf2$100000$${salt}$${hash}`);
console.log('\nStore it:  wrangler secret put ADMIN_PASS_HASH');
console.log('Then delete ADMIN_PASS from wrangler.toml.\n');
