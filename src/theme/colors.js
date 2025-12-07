/**
 * Hệ thống màu sắc chung cho toàn dự án
 * Sử dụng biến CSS từ index.css và Tailwind classes
 * Hỗ trợ Dark Mode tự động
 */

/**
 * Màu sắc cơ bản - Sử dụng CSS variables từ index.css
 * Tự động chuyển đổi theo dark mode
 */
export const colors = {
    // Màu nền và văn bản chính
    background: 'bg-background',                    // Trắng (light) / Đen (dark)
    foreground: 'text-foreground',                  // Đen (light) / Trắng (dark)

    // Card
    card: 'bg-card',
    cardForeground: 'text-card-foreground',
    cardBorder: 'border-border',

    // Màu phụ (Secondary)
    secondary: 'bg-secondary',
    secondaryForeground: 'text-secondary-foreground',

    // Màu muted (nhạt hơn)
    muted: 'bg-muted',
    mutedForeground: 'text-muted-foreground',

    // Border và input
    border: 'border-border',
    input: 'bg-input',
    inputBorder: 'border-input',

    // Primary (nút chính)
    primary: 'bg-primary',
    primaryForeground: 'text-primary-foreground',

    // Accent (nhấn mạnh)
    accent: 'bg-accent',
    accentForeground: 'text-accent-foreground',
};

/**
 * Màu trạng thái - Giữ nguyên cho cả light/dark
 */
export const statusColors = {
    // Success
    success: 'bg-green-600 text-white',
    successHover: 'hover:bg-green-700',
    successText: 'text-green-600 dark:text-green-400',
    successBg: 'bg-green-50 dark:bg-green-900/20',
    successBorder: 'border-green-200 dark:border-green-800',

    // Warning
    warning: 'bg-yellow-600 text-white',
    warningHover: 'hover:bg-yellow-700',
    warningText: 'text-yellow-600 dark:text-yellow-400',
    warningBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    warningBorder: 'border-yellow-200 dark:border-yellow-800',

    // Error/Danger
    danger: 'bg-red-600 text-white',
    dangerHover: 'hover:bg-red-700',
    dangerText: 'text-red-600 dark:text-red-400',
    dangerBg: 'bg-red-50 dark:bg-red-900/20',
    dangerBorder: 'border-red-200 dark:border-red-800',

    // Info
    info: 'bg-blue-600 text-white',
    infoHover: 'hover:bg-blue-700',
    infoText: 'text-blue-600 dark:text-blue-400',
    infoBg: 'bg-blue-50 dark:bg-blue-900/20',
    infoBorder: 'border-blue-200 dark:border-blue-800',
};

/**
 * Màu văn bản theo độ đậm nhạt
 */
export const textColors = {
    primary: 'text-foreground',                                    // Chữ chính
    secondary: 'text-muted-foreground',                            // Chữ phụ
    muted: 'text-gray-500 dark:text-gray-400',                    // Chữ mờ
    disabled: 'text-gray-400 dark:text-gray-600',                 // Chữ disabled
    placeholder: 'placeholder:text-gray-400 dark:placeholder:text-gray-500',
};

/**
 * Màu nền theo độ đậm nhạt
 */
export const bgColors = {
    primary: 'bg-background',                                      // Nền chính (trắng/đen)
    secondary: 'bg-secondary',                                     // Nền phụ
    muted: 'bg-gray-50 dark:bg-gray-800/40',                      // Nền mờ
    hover: 'hover:bg-gray-50/50 dark:hover:bg-gray-800/40',       // Hover
    active: 'bg-gray-100 dark:bg-gray-800',                        // Active
    disabled: 'bg-gray-100 dark:bg-gray-900',                      // Disabled
};

/**
 * Màu border theo độ đậm nhạt
 */
export const borderColors = {
    default: 'border-border',                                      // Border mặc định
    light: 'border-gray-100 dark:border-gray-800',                // Border nhạt
    medium: 'border-gray-200 dark:border-gray-700',               // Border trung bình
    strong: 'border-gray-300 dark:border-gray-600',               // Border đậm
    divider: 'divide-gray-200 dark:divide-gray-800',              // Divider
};

/**
 * Màu cho dropdown, popover, modal
 */
export const overlayColors = {
    dropdown: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700',
    modal: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    tooltip: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
    backdrop: 'bg-black/50 dark:bg-black/70',
};

/**
 * Màu cho input, select, textarea
 */
export const inputColors = {
    base: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100',
    focus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400',
    disabled: 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed',
    error: 'border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-400',
};

/**
 * Màu cho select dropdown (bao gồm cả option)
 */
export const selectColors = {
    base: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100',
    focus: 'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 focus:outline-none',
    option: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
};

/**
 * Màu cho sidebar và navigation
 */
export const navColors = {
    background: 'bg-white dark:bg-gray-900',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-200',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
    active: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
};

/**
 * Màu cho button variants
 */
export const buttonColors = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
};

/**
 * Màu cho badge và tags
 */
export const badgeColors = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * Màu cho stats card accent
 */
export const statsCardColors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-300',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-200',
};

/**
 * Màu cho priority (ưu tiên nhiệm vụ)
 */
export const priorityColors = {
    LOW: 'text-green-600 dark:text-green-400',
    MEDIUM: 'text-yellow-600 dark:text-yellow-400',
    HIGH: 'text-red-600 dark:text-red-400',
};

/**
 * Màu cho status (trạng thái nhiệm vụ)
 */
export const taskStatusColors = {
    'TO_DO': 'text-gray-500 dark:text-gray-400',
    'IN_PROGRESS': 'text-blue-600 dark:text-blue-400',
    'COMPLETED': 'text-green-600 dark:text-green-400',
};

/**
 * Helper function: Kết hợp nhiều classes
 * @param {...string} classes - Danh sách các class cần kết hợp
 * @returns {string} - String các classes đã kết hợp
 */
export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};

/**
 * Helper function: Lấy màu theo variant
 * @param {string} variant - Tên variant (primary, secondary, danger, ...)
 * @param {object} colorMap - Map màu sắc (buttonColors, badgeColors, ...)
 * @returns {string} - Classes màu tương ứng
 */
export const getColorByVariant = (variant, colorMap) => {
    return colorMap[variant] || colorMap.default || '';
};

export default {
    colors,
    statusColors,
    textColors,
    bgColors,
    borderColors,
    overlayColors,
    inputColors,
    selectColors,
    navColors,
    buttonColors,
    badgeColors,
    statsCardColors,
    priorityColors,
    taskStatusColors,
    cn,
    getColorByVariant,
};
