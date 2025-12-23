import {
    CheckSquare,
    Bug,
    BookOpen,
    Zap,
    Link2
} from 'lucide-react';

// Task type constants
export const TASK_TYPES = {
    TASK: 'TASK',
    BUG: 'BUG',
    USER_STORY: 'USER_STORY',
    EPIC: 'EPIC',
    SUB_TASK: 'SUB_TASK',
};

// Get icon component for task type
export const getTaskTypeIcon = (type) => {
    if (!type) return CheckSquare;

    const typeUpper = type.toString().toUpperCase();

    switch (typeUpper) {
        case 'BUG':
            return Bug;
        case 'USER_STORY':
        case 'USERSTORY':
        case 'STORY':
            return BookOpen;
        case 'EPIC':
            return Zap;
        case 'SUB_TASK':
        case 'SUBTASK':
        case 'SUB-TASK':
            return Link2;
        case 'TASK':
        default:
            return CheckSquare;
    }
};

// Get color class for task type icon
export const getTaskTypeColor = (type) => {
    if (!type) return 'text-blue-600 dark:text-blue-400';

    const typeUpper = type.toString().toUpperCase();

    switch (typeUpper) {
        case 'BUG':
            return 'text-red-500 dark:text-red-400';
        case 'USER_STORY':
        case 'USERSTORY':
        case 'STORY':
            return 'text-green-600 dark:text-green-400';
        case 'EPIC':
            return 'text-purple-600 dark:text-purple-400';
        case 'SUB_TASK':
        case 'SUBTASK':
        case 'SUB-TASK':
            return 'text-cyan-600 dark:text-cyan-400';
        case 'TASK':
        default:
            return 'text-blue-600 dark:text-blue-400';
    }
};

// Get background color class for task type badge
export const getTaskTypeBgColor = (type) => {
    if (!type) return 'bg-blue-50 dark:bg-blue-900/30';

    const typeUpper = type.toString().toUpperCase();

    switch (typeUpper) {
        case 'BUG':
            return 'bg-red-50 dark:bg-red-900/30';
        case 'USER_STORY':
        case 'USERSTORY':
        case 'STORY':
            return 'bg-green-50 dark:bg-green-900/30';
        case 'EPIC':
            return 'bg-purple-50 dark:bg-purple-900/30';
        case 'SUB_TASK':
        case 'SUBTASK':
        case 'SUB-TASK':
            return 'bg-cyan-50 dark:bg-cyan-900/30';
        case 'TASK':
        default:
            return 'bg-blue-50 dark:bg-blue-900/30';
    }
};

// Translate task type to Vietnamese
export const translateTaskType = (type) => {
    if (!type) return 'Task';

    const typeUpper = type.toString().toUpperCase();

    switch (typeUpper) {
        case 'BUG':
            return 'Bug';
        case 'USER_STORY':
        case 'USERSTORY':
        case 'STORY':
            return 'User Story';
        case 'EPIC':
            return 'Epic';
        case 'SUB_TASK':
        case 'SUBTASK':
        case 'SUB-TASK':
            return 'Sub-task';
        case 'TASK':
        default:
            return 'Task';
    }
};

// Get task type variant for Badge component
export const getTaskTypeVariant = (type) => {
    if (!type) return 'blue';

    const typeUpper = type.toString().toUpperCase();

    switch (typeUpper) {
        case 'BUG':
            return 'red';
        case 'USER_STORY':
        case 'USERSTORY':
        case 'STORY':
            return 'green';
        case 'EPIC':
            return 'purple';
        case 'SUB_TASK':
        case 'SUBTASK':
        case 'SUB-TASK':
            return 'cyan';
        case 'TASK':
        default:
            return 'blue';
    }
};
