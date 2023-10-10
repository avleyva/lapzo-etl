"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenericUsers = void 0;
const getGenericUsers = async (clientId) => {
    const roles = {
        admin: 'ADMIN',
        instructor: 'INSTRUCTOR',
        participant: 'PARTICIPANT',
        lite: 'LITE',
    };
    const users = [];
    for (const role in roles) {
        const userTmp = {
            user_fb: '',
            email: `generic_${role}@${clientId}.com`,
            first_name: `Generic ${role}`,
            last_name: '',
            client_id: clientId,
            bio: '',
            deleted: false,
            hero_url: 'https://picsum.photos/1200/300',
            image_url: 'https://res.cloudinary.com/lernit/image/upload/v1691380743/Courses/yeh6dbwloqpbeldtak9t.png',
            notifications_count: 0,
            onboard: null,
            tutorial: null,
            type: 'A',
            role: `GENERIC ${roles[role]}`,
            ou: 'GENERIC OU',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            topics_json: null,
            ou_json: null,
            tutorial_json: null,
            competecies_json: null,
            additional_info_json: null,
            disabled: false,
            deleted_at: null,
            curp: null,
            platformLite: false,
            emailPendingToVerify: false,
            numero_empleado: null,
            ask_change_pwd: null,
            birthday: null,
            performance: false,
            notification_settings_json: '{}',
            dark: false,
            business_name_uuid: null,
            token_chg_pwd: null,
        };
        users.push(userTmp);
    }
    return users;
};
exports.getGenericUsers = getGenericUsers;
//# sourceMappingURL=users.utils.js.map