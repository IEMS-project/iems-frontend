const ISO_LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const HAS_TIME_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

export function normalizeChatTimestamp(value) {
  if (!value) return value;
  if (value instanceof Date || typeof value === "number") return value;

  if (Array.isArray(value) && value.length >= 5) {
    const [year, month, day, hour, minute, second = 0, nano = 0] = value;
    return Date.UTC(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
  }

  if (typeof value !== "string") return value;
  const trimmed = value.trim();

  // Backend chat-service stores LocalDateTime. When deployed on UTC hosts,
  // Jackson emits an ISO value without "Z"; treat that as UTC for local display.
  if (ISO_LOCAL_DATE_TIME.test(trimmed) && !HAS_TIME_ZONE.test(trimmed)) {
    return `${trimmed}Z`;
  }

  return trimmed;
}

export function parseChatDate(value) {
  const date = new Date(normalizeChatTimestamp(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getChatTimeMs(value) {
  return parseChatDate(value)?.getTime() ?? 0;
}

export function formatChatTime(value, options, locale = "vi-VN") {
  const date = parseChatDate(value);
  return date ? date.toLocaleTimeString(locale, options) : "";
}

export function formatChatDate(value, options, locale = "vi-VN") {
  const date = parseChatDate(value);
  return date ? date.toLocaleDateString(locale, options) : "";
}

export function formatChatDateTime(value, options, locale = "vi-VN") {
  const date = parseChatDate(value);
  return date ? date.toLocaleString(locale, options) : "";
}

export function isSameLocalDay(left, right) {
  const leftDate = parseChatDate(left);
  const rightDate = parseChatDate(right);
  if (!leftDate || !rightDate) return false;
  return leftDate.toDateString() === rightDate.toDateString();
}
