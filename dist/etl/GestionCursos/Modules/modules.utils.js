"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseId = void 0;
const getCourseId = (course_fb, lmsCourses) => {
    const course = lmsCourses.find((c) => c.course_fb === course_fb);
    return course?.id || null;
};
exports.getCourseId = getCourseId;
//# sourceMappingURL=modules.utils.js.map