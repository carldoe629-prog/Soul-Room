// src/lib/moderation/contact-detector.ts
// Layer 1 of the Soul Room contact-sharing defence architecture.
// Runs on every outgoing message and every profile field save.
// Silent redaction in chat. Hard block on profile fields.

// ── Phone number patterns — Africa-first ──────────────────────────
// Each pattern covers the full format including country code and local format
const PHONE_PATTERNS: RegExp[] = [
  /(\+?234|0)[789]\d{9}/g,          // Nigeria
  /(\+?233|0)[235]\d{8}/g,          // Ghana
  /(\+?254|0)[17]\d{8}/g,           // Kenya
  /(\+?27|0)[6-8]\d{8}/g,           // South Africa
  /(\+?44|0)7\d{9}/g,               // UK mobile
  /(\+?1)[2-9]\d{9}/g,              // US/Canada
  /(\+?20)1\d{9}/g,                 // Egypt
  /(\+?255|0)[67]\d{8}/g,           // Tanzania
  /(\+?256|0)[37]\d{8}/g,           // Uganda
  /(\+?225|0)[0-9]\d{8}/g,          // Ivory Coast
  /(\+?221|0)[37]\d{8}/g,           // Senegal
  /\b\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}\b/g, // Generic 10-digit
];

// ── Email ─────────────────────────────────────────────────────────
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// ── At-sign handles ───────────────────────────────────────────────
const HANDLE_PATTERN = /@[a-zA-Z0-9_.]{3,}/g;

// ── URLs ──────────────────────────────────────────────────────────
const URL_PATTERNS: RegExp[] = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+\.[a-z]{2,}/gi,
  /\b[a-zA-Z0-9\-]{2,}\.(com|ng|gh|ke|io|app|co|net|org|me|ly|to)[^\s]*/gi,
  /bit\.ly\/[^\s]+/gi,
  /t\.me\/[^\s]+/gi,
  /wa\.me\/[^\s]+/gi,
];

// ── Platform keywords — ONLY used in profile hard-block, NOT in chat filter
// In chat: platform keywords alone are not blocked.
// "I love WhatsApp" is fine. "WhatsApp: 0801234" is caught by phone pattern.
const PLATFORM_KEYWORDS_PROFILE = [
  /\b(ig|insta|instagram)\b[\s:@]*/i,
  /\b(sc|snapchat)\b[\s:@]*/i,
  /\b(whatsapp|whats\s?app|wa)\b[\s:@]*/i,
  /\b(telegram|tg)\b[\s:@]*/i,
  /\b(twitter|tiktok|facebook|fb)\b[\s:@]*/i,
];

export interface FilterResult {
  isClean: boolean;
  redactedContent: string;
  detectionType: string | null;
}

// ── Chat filter — redacts, never blocks ───────────────────────────
// The sender sees their original message delivered successfully.
// The receiver sees the redacted version.
// The sender never knows the filter fired.
export function filterChatMessage(content: string): FilterResult {
  let redacted = content;
  let detectionType: string | null = null;

  // Phone numbers
  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      detectionType = 'phone';
      pattern.lastIndex = 0;
      redacted = redacted.replace(pattern, '[Contact info protected by Soul Room]');
    }
    pattern.lastIndex = 0;
  }

  // Email
  EMAIL_PATTERN.lastIndex = 0;
  if (EMAIL_PATTERN.test(content)) {
    detectionType = detectionType ?? 'email';
    EMAIL_PATTERN.lastIndex = 0;
    redacted = redacted.replace(EMAIL_PATTERN, '[Contact info protected by Soul Room]');
  }
  EMAIL_PATTERN.lastIndex = 0;

  // At-sign handles
  HANDLE_PATTERN.lastIndex = 0;
  if (HANDLE_PATTERN.test(content)) {
    detectionType = detectionType ?? 'handle';
    HANDLE_PATTERN.lastIndex = 0;
    redacted = redacted.replace(HANDLE_PATTERN, '[Handle protected by Soul Room]');
  }
  HANDLE_PATTERN.lastIndex = 0;

  // URLs
  for (const pattern of URL_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      detectionType = detectionType ?? 'url';
      pattern.lastIndex = 0;
      redacted = redacted.replace(pattern, '[Link protected by Soul Room]');
    }
    pattern.lastIndex = 0;
  }

  return {
    isClean: detectionType === null,
    redactedContent: redacted,
    detectionType,
  };
}

// ── Profile field check — returns true if contact info found ──────
// Used for bios, display names, usernames.
// Includes platform keyword detection (unlike chat filter).
export function profileFieldContainsContactInfo(text: string): boolean {
  // Check phone
  for (const p of PHONE_PATTERNS) {
    p.lastIndex = 0;
    if (p.test(text)) { p.lastIndex = 0; return true; }
    p.lastIndex = 0;
  }
  // Check email
  EMAIL_PATTERN.lastIndex = 0;
  if (EMAIL_PATTERN.test(text)) { EMAIL_PATTERN.lastIndex = 0; return true; }
  EMAIL_PATTERN.lastIndex = 0;
  // Check handles
  HANDLE_PATTERN.lastIndex = 0;
  if (HANDLE_PATTERN.test(text)) { HANDLE_PATTERN.lastIndex = 0; return true; }
  HANDLE_PATTERN.lastIndex = 0;
  // Check URLs
  for (const p of URL_PATTERNS) {
    p.lastIndex = 0;
    if (p.test(text)) { p.lastIndex = 0; return true; }
    p.lastIndex = 0;
  }
  // Check platform keywords (profile only)
  for (const p of PLATFORM_KEYWORDS_PROFILE) {
    if (p.test(text)) return true;
  }
  return false;
}

// Keep the old export name for backward compatibility —
// existing callers of scanMessageContent() get the chat filter behaviour
export function scanMessageContent(content: string): {
  flagged: boolean;
  violations: string[];
  severity: string;
  cleanContent?: string;
} {
  const result = filterChatMessage(content);
  return {
    flagged: !result.isClean,
    violations: result.detectionType ? [result.detectionType] : [],
    severity: result.detectionType === 'phone' || result.detectionType === 'email' ? 'high' : 'medium',
    cleanContent: result.redactedContent,
  };
}

// Violation key for Redis tracking (used by future drip-feed accumulator)
export function buildViolationKey(userId: string): string {
  const month = new Date().toISOString().slice(0, 7);
  return `contactviolations:${userId}:${month}`;
}
