"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLessonSubType = exports.getLessonType = void 0;
const getLessonType = (lxpLessonType, lxpLessonSubtype) => {
    switch (`${lxpLessonType}-${lxpLessonSubtype}`) {
        case 'A-':
            return 'SCORM_HTML';
            break;
        case 'D-':
            return 'QUADRANT';
            break;
        case 'E-':
            return 'EVALUATION';
            break;
        case 'E-MULTIPLE':
            return 'EVALUATION';
            break;
        case 'E2-':
            return 'EVAL_LABEL';
            break;
        case 'EP-':
            return 'PRESENTIAL';
            break;
        case 'F-':
            return 'FORUM';
            break;
        case 'G-':
            return 'URL';
            break;
        case 'H-':
            return 'HTML5';
            break;
        case '-HTML': // TODO: Revisar
            return 'EMBEDDED';
            break;
        case 'I-':
            return 'INTERACTION';
            break;
        case 'V-':
            return 'VIDEO';
            break;
        case 'L-':
            return 'LECTURE';
            break;
        case 'L-EDITOR':
            return 'LECTURE';
            break;
        case 'L-HTML':
            return 'LECTURE';
            break;
        case 'L-PDF':
            return 'LECTURE';
            break;
        case 'L-URL':
            return 'LECTURE';
            break;
        case 'M-':
            return 'MEETING';
            break;
        case 'P-':
            return 'INSTRUCTIONS';
            break;
        case 'S-':
            return 'SURVEY';
            break;
        case 'T-':
            return 'TASK';
            break;
        case 'TK-':
            return 'TOOLKIT_LEC';
            break;
        case 'TK-HTML':
            return 'TOOLKIT_LEC';
            break;
        case 'W-':
            return 'WEBINAR';
            break;
        default:
            return 'UNKNOWN';
            break;
    }
};
exports.getLessonType = getLessonType;
const getLessonSubType = (lxpLessonSubtype) => {
    switch (lxpLessonSubtype) {
        case 'URL':
            return 'URL';
            break;
        case 'HTML':
            return 'HTML';
            break;
        case 'MULTIPLE':
            return 'MULTIPLE';
            break;
        case 'PDF':
            return 'PDF';
            break;
        case 'EDITOR':
            return 'EDITOR';
            break;
        default:
            return null;
            break;
    }
};
exports.getLessonSubType = getLessonSubType;
// {
//     A  = 'A', // Scorm/HTML - iframe
//     D  = 'D', // Quadrant (Es otro tipo de evaluación) ??
//     E  = 'E', // Evaluation (y este tiene tipos)
//     E2 = 'E2', // Evaluación (como label no como tipo)
//     EP = 'EP', // Presential Evaluation
//     F  = 'F', // Forum (Foro)
//     G  = 'G', // Gif (url) ??
//     H  = 'H', // Embedded (HTML5) - iframe
//     I  = 'I', // Interaction
//     L  = 'L', // Lecture (comtempal estas opciones - Crear HTML / Cargar PDF)
//     M  = 'M', // Meeting
//     P  = 'P', // Instructions
//     S  = 'S', // Survey (Encuesta)
//     T  = 'T', // Task
//     TK = 'TK', // Toolkit (pero como base toma tipo Lecture)
//     V  = 'V', // Video
//     W  = 'W', // Webinar UnKnown
// }
//# sourceMappingURL=courses_lessons.utils.js.map