#!/usr/bin/env node
/**
 * Generate a TELEGRAM_SESSION (GramJS StringSession) for the Telegram OSINT relay.
 *
 * Usage:
 *   npm run telegram:auth          (reads .env.local automatically)
 *
 * Output:
 *   Prints TELEGRAM_SESSION=... to stdout — paste it into .env.local
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Auto-load .env.local so the script works with just `npm run telegram:auth`
const root = resolve(fileURLToPath(import.meta.url), '../../..');
for (const name of ['.env.local', '.env']) {
  try {
    const lines = readFileSync(resolve(root, name), 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
    break;
  } catch { /* file not found, try next */ }
}

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const apiId = parseInt(String(process.env.TELEGRAM_API_ID || ''), 10);
const apiHash = String(process.env.TELEGRAM_API_HASH || '');

if (!apiId || !apiHash) {
  console.error('Missing TELEGRAM_API_ID or TELEGRAM_API_HASH.');
  console.error('Add them to .env.local:\n  TELEGRAM_API_ID=...\n  TELEGRAM_API_HASH=...');
  console.error('Get them from https://my.telegram.org/apps');
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

try {
  const phoneNumber = (await rl.question('Phone number (with country code, e.g. +994...): ')).trim();
  const password = (await rl.question('2FA password (press Enter if none): ')).trim();

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 3 });

  await client.start({
    phoneNumber: async () => phoneNumber,
    password: async () => password || undefined,
    phoneCode: async () => (await rl.question('Verification code from Telegram: ')).trim(),
    onError: (err) => console.error(err),
  });

  const session = client.session.save();
  console.log('\n✅ Session generated! Add this to your .env.local:');
  console.log(`TELEGRAM_SESSION=${session}`);

  await client.disconnect();
} finally {
  rl.close();
}


const rl = readline.createInterface({ input, output });

try {
  const phoneNumber = (await rl.question('Phone number (with country code, e.g. +971...): ')).trim();
  const password = (await rl.question('2FA password (press enter if none): ')).trim();

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 3 });

  await client.start({
    phoneNumber: async () => phoneNumber,
    password: async () => password || undefined,
    phoneCode: async () => (await rl.question('Verification code from Telegram: ')).trim(),
    onError: (err) => console.error(err),
  });

  const session = client.session.save();
  console.log('\n✅ Generated session. Add this as a Railway secret:');
  console.log(`TELEGRAM_SESSION=${session}`);

  await client.disconnect();
} finally {
  rl.close();
}
