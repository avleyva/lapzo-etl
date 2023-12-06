"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLXPLessonResource = void 0;
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
const getLXPLessonResource = (lxpLesson) => {
    switch (lxpLesson.type) {
        case 'A':
            return {
                type: 'html',
                content: lxpLesson.html || '',
            };
            break;
        case 'V':
            return {
                type: 'video',
                content: lxpLesson.video || '',
            };
            break;
        case 'L':
            return {
                type: 'lecture',
                content: lxpLesson.lecture || '',
            };
            break;
        case 'H':
            return {
                type: 'embed',
                content: lxpLesson.embed_json || '',
            };
            break;
        default:
            return null;
            break;
    }
};
exports.getLXPLessonResource = getLXPLessonResource;
//# sourceMappingURL=courses_lesson_resource.utils.js.map