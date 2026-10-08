import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let eventsConfig = null;
function getEventsConfig() {
  if (!eventsConfig) {
    const configPath = path.resolve(__dirname, '../../config/events.json');
    eventsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return eventsConfig;
}

export function sanitizeUsername(raw) {
  if (!raw || typeof raw !== 'string') {
    return 'anonimo';
  }

  // Remove leading @, strip HTML/scripts and special unsafe characters
  let clean = raw
    .trim()
    .replace(/^@+/, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();

  if (clean.length === 0) {
    return 'anonimo';
  }

  return clean.slice(0, 32);
}

export function sanitizeComment(raw) {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  const clean = raw
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 120);

  return clean;
}

export function mapGiftToAction(giftName) {
  const config = getEventsConfig();
  if (config.gifts && config.gifts[giftName]) {
    return config.gifts[giftName];
  }

  return {
    action: 'city_bonus',
    tier: 'common',
    value: 1,
    description: 'Bônus geral para a cidade'
  };
}

export function mapCommentToCommand(comment) {
  const config = getEventsConfig();
  const text = String(comment || '').toLowerCase().trim();

  if (!config.commands) {
    return null;
  }

  for (const [cmd, action] of Object.entries(config.commands)) {
    // Check if the command keyword is present as a word/subphrase
    const regex = new RegExp(`\\b${cmd}\\b`, 'i');
    if (regex.test(text) || text.includes(cmd)) {
      return action;
    }
  }

  return null;
}
