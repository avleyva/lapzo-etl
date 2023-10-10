"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.WAITNING_TIME_BETWEEN_LOADS = exports.MAX_RECORDS_TO_INSERT = void 0;
exports.MAX_RECORDS_TO_INSERT = 10;
exports.WAITNING_TIME_BETWEEN_LOADS = 500;
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
//# sourceMappingURL=utils.js.map