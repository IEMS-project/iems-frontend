import { useTranslation } from 'react-i18next';
import {
    getTaskTypeIcon,
    getTaskTypeColor,
    getTaskTypeBgColor,
    getTaskTypeVariant
} from '@/features/tasks/utils/taskTypeUtils';

/**
 * Custom hook for task type utilities with i18n support
 */
export const useTaskType = () => {
    const { t } = useTranslation();

    const translateTaskType = (type) => {
        if (!type) return t('tasks.types.task');

        const typeUpper = type.toString().toUpperCase();

        switch (typeUpper) {
            case 'BUG':
                return t('tasks.types.bug');
            case 'USER_STORY':
            case 'USERSTORY':
            case 'STORY':
                return t('tasks.types.userStory');
            case 'EPIC':
                return t('tasks.types.epic');
            case 'SUB_TASK':
            case 'SUBTASK':
            case 'SUB-TASK':
                return t('tasks.types.subTask');
            case 'TASK':
            default:
                return t('tasks.types.task');
        }
    };

    return {
        getTaskTypeIcon,
        getTaskTypeColor,
        getTaskTypeBgColor,
        getTaskTypeVariant,
        translateTaskType
    };
};
