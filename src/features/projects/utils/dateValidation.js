export function todayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function toDateStr(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function validateDates({ startDate, endDate, createdAt, allowPastStart = false } = {}) {
  const today = todayStr();
  const start = toDateStr(startDate);
  const end = toDateStr(endDate);
  const created = toDateStr(createdAt);

  if (start && !allowPastStart && start < today)
    return "Start date cannot be in the past.";

  if (end) {
    if (end < today)
      return "End date / due date cannot be in the past.";
    if (start && end < start)
      return "End date cannot be before the start date.";
  }

  if (start && created && start < created)
    return "Due date cannot be before the issue's creation date.";

  return null;
}
