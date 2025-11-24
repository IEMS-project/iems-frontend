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
  ["Chờ", "Chờ"],
  ["To Do", "Chờ"],
  ["TODO", "Chờ"],
  ["TO DO", "Chờ"],
  ["Not Started", "Chờ"],
  ["Pending", "Chờ"],
  ["Backlog", "Chờ"],
  ["Đang làm", "Đang làm"],
  ["In Progress", "Đang làm"],
  ["IN_PROGRESS", "Đang làm"],
  ["Processing", "Đang làm"],
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
  ["Tạm hoãn", "Tạm hoãn"],
  ["On Hold", "Tạm hoãn"],
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
  "Chờ": "yellow",
  "Đang làm": "blue",
  "Đang duyệt": "purple",
  "Hoàn thành": "green",
  "Bị chặn": "red",
  "Đã hủy": "gray",
  "Tạm hoãn": "orange",
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


