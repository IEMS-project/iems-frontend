const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const JSON_BLOCK_PATTERN = /```json[\s\S]*?```/gi;
const TECH_LINE_PATTERN = /^.*\b(token|endpoint|stack trace)\b.*$/gim;
const INLINE_TECH_FIELD_PATTERN = /\s*\|?\s*(id|projectId|project_id|issueId|internalId|token|endpoint)\s*=\s*[^|\n]+/gi;

const replacements = [
  [/Tim thay/g, "Tìm thấy"],
  [/Hien thi/g, "Hiển thị"],
  [/Rui ro/g, "Rủi ro"],
  [/Cach xu ly/g, "Cách xử lý"],
  [/Khong the xac dinh/g, "Không thể xác định"],
  [/Tom tat ngan/gi, "Tóm tắt ngắn"],
  [/Giai thich chi tiet/gi, "Giải thích chi tiết"],
  [/Giai thiet chi tiet/gi, "Giải thích chi tiết"],
  [/Vi du de hieu/gi, "Ví dụ dễ hiểu"],
  [/Ket luan/gi, "Kết luận"],
  [/\bunknown\b/gi, "Chưa phân loại"],
  [/\bundefined\b/gi, "Chưa có dữ liệu"],
  [/\bnull\b/gi, "Chưa có dữ liệu"],
];

export function sanitizeAgentResponse(content) {
  if (!content || typeof content !== "string") return content || "";

  let sanitized = content
    .replace(JSON_BLOCK_PATTERN, "")
    .replace(TECH_LINE_PATTERN, "")
    .replace(INLINE_TECH_FIELD_PATTERN, "")
    .replace(UUID_PATTERN, "[đã ẩn]")
    .replace(/^User\s+.*?->\s*ISSUE_UPDATE\s*/gim, "")
    .replace(/(?<!\n)(#{2,6}\s+)/g, "\n\n$1")
    .replace(/(?<!\n)(-\s+)/g, "\n- ");

  replacements.forEach(([pattern, value]) => {
    sanitized = sanitized.replace(pattern, value);
  });

  return sanitized.replace(/\n{3,}/g, "\n\n").trim();
}

export const AGENT_FRIENDLY_ERROR =
  "Mình chưa thể lấy dữ liệu dự án lúc này. Bạn thử lại sau vài giây nhé.";
