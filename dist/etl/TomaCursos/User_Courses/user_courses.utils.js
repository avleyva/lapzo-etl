"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCourseStatus = void 0;
const getUserCourseStatus = (lxpStatus) => {
    switch (lxpStatus) {
        case 'approved':
            return 'APPROVED';
            break;
        case 'failed':
            return 'FAILED';
            break;
        case 'inProgress':
        case 'in_progress':
            return 'IN_PROGRESS';
            break;
        case 'inactive':
            return 'INACTIVE';
            break;
        default:
            return null;
            break;
    }
};
exports.getUserCourseStatus = getUserCourseStatus;
//# sourceMappingURL=user_courses.utils.js.map