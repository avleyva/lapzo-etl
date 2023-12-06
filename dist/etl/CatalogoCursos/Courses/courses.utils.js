"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseDifficulty = exports.getCourseAuthor = void 0;
const getCourseAuthor = async (
// jsonData: string,
subdomain, createdByJson, vdmLMSUsers) => {
    // const createdByJson = JSON.parse(jsonData);
    let lmsLMSUser = vdmLMSUsers.find((e) => e?.legacy_user_fb === createdByJson?.uid ? e.id : null);
    if (!lmsLMSUser) {
        lmsLMSUser = vdmLMSUsers.find((e) => e?.email === `generic_instructor@${subdomain}.com` ? e.id : null);
    }
    return lmsLMSUser?.id || null;
};
exports.getCourseAuthor = getCourseAuthor;
const getCourseDifficulty = (difficulty) => {
    return difficulty === 2 ? 'medium' : difficulty === 3 ? 'advanced' : 'easy';
};
exports.getCourseDifficulty = getCourseDifficulty;
//# sourceMappingURL=courses.utils.js.map