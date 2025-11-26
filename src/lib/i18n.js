const normalize = (value) => {
  if (value === undefined || value === null) return "";
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
};

const createMap = (entries) => {
  const map = new Map();
  entries.forEach(([key, value]) => {
    map.set(normalize(key), value);
  });
  return map;
};

const STATUS_ENTRIES = [
  ["Đang chờ", "Đang chờ"],
  ["To Do", "Đang chờ"],
  ["TODO", "Đang chờ"],
  ["TO DO", "Đang chờ"],
  ["Not Started", "Đang chờ"],
  ["Pending", "Đang chờ"],
  ["Backlog", "Đang chờ"],
  ["Đang thực hiện", "Đang thực hiện"],
  ["In Progress", "Đang thực hiện"],
  ["IN_PROGRESS", "Đang thực hiện"],
  ["Processing", "Đang thực hiện"],
  ["Đang duyệt", "Đang duyệt"],
  ["In Review", "Đang duyệt"],
  ["Review", "Đang duyệt"],
  ["Đang kiểm tra", "Đang duyệt"],
  ["Hoàn thành", "Hoàn thành"],
  ["Done", "Hoàn thành"],
  ["Completed", "Hoàn thành"],
  ["Complete", "Hoàn thành"],
  ["COMPLETED", "Hoàn thành"],
  ["Closed", "Hoàn thành"],
  ["Đã hủy", "Đã hủy"],
  ["Cancelled", "Đã hủy"],
  ["Canceled", "Đã hủy"],
  ["Tạm ngừng", "Tạm ngừng"],
  ["On Hold", "Tạm ngừng"],
  ["PLANNING", "Đang chờ"],

  ["Bị chặn", "Bị chặn"],
  ["Blocked", "Bị chặn"],
  ["Chưa xác định", "Chưa xác định"],
  ["Unknown", "Chưa xác định"],
];

const PRIORITY_ENTRIES = [
  ["Cao nhất", "Cao nhất"],
  ["Highest", "Cao nhất"],
  ["Critical", "Cao nhất"],
  ["Cao", "Cao"],
  ["High", "Cao"],
  ["Trung bình", "Trung bình"],
  ["Medium", "Trung bình"],
  ["Vừa", "Trung bình"],
  ["Thấp", "Thấp"],
  ["Low", "Thấp"],
  ["Thấp nhất", "Thấp nhất"],
  ["Lowest", "Thấp nhất"],
  ["Không ưu tiên", "Không ưu tiên"],
  ["None", "Không ưu tiên"],
  ["Normal", "Trung bình"],
];

const WORK_TYPE_ENTRIES = [
  ["Epic", "Epic"],
  ["Task", "Nhiệm vụ"],
  ["Story", "User story"],
  ["Bug", "Lỗi"],
  ["Subtask", "Nhiệm vụ con"],
  ["Sub Task", "Nhiệm vụ con"],
  ["Ticket", "Ticket"],
];

const statusMap = createMap(STATUS_ENTRIES);
const priorityMap = createMap(PRIORITY_ENTRIES);
const workTypeMap = createMap(WORK_TYPE_ENTRIES);

const STATUS_VARIANT = {
  "Đang chờ": "yellow",
  "Đang thực hiện": "blue",
  "Đang duyệt": "purple",
  "Hoàn thành": "green",
  "Bị chặn": "red",
  "Đã hủy": "gray",
  "Tạm ngừng": "orange",
};

const PRIORITY_VARIANT = {
  "Cao nhất": "red",
  "Cao": "red",
  "Trung bình": "yellow",
  "Thấp": "blue",
  "Thấp nhất": "gray",
};

export const translateStatus = (value) => {
  if (value === undefined || value === null) return "";
  const key = normalize(value);
  return statusMap.get(key) || value;
};

export const translatePriority = (value) => {
  if (value === undefined || value === null) return "";
  const key = normalize(value);
  return priorityMap.get(key) || value;
};

export const translateWorkType = (value) => {
  if (value === undefined || value === null) return "";
  const key = normalize(value);
  return workTypeMap.get(key) || value;
};

export const getStatusVariant = (value, fallback = "gray") => {
  const translated = translateStatus(value);
  return STATUS_VARIANT[translated] || fallback;
};

export const getPriorityVariant = (value, fallback = "gray") => {
  const translated = translatePriority(value);
  return PRIORITY_VARIANT[translated] || fallback;
};

// Reverse translation: Vietnamese to Backend Enum
export const reverseTranslateStatus = (vietnameseValue) => {
  const statusMapping = {
    "Đang chờ": "TO_DO",
    "Đang thực hiện": "IN_PROGRESS",
    "Đang duyệt": "IN_REVIEW",
    "Hoàn thành": "COMPLETED",
    "Bị chặn": "BLOCKED",
    "Đã hủy": "CANCELLED",
    "Tạm ngừng": "ON_HOLD"
  };
  return statusMapping[vietnameseValue] || vietnameseValue;
};

export const reverseTranslatePriority = (vietnameseValue) => {
  const priorityMapping = {
    "Cao nhất": "CRITICAL",
    "Cao": "HIGH",
    "Trung bình": "MEDIUM",
    "Thấp": "LOW",
    "Thấp nhất": "LOWEST"
  };
  return priorityMapping[vietnameseValue] || vietnameseValue;
};

