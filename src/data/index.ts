import {EXAM_QUESTIONS_PART_1} from './examQuestionsPart1';
import {EXAM_QUESTIONS_PART_2} from './examQuestionsPart2';
import {EXAM_QUESTIONS_LECTURE_EXTRAS} from './examQuestionsExtra';
import {AIP_TEXTBOOK_QUESTIONS} from './aipTextbookQuestions';
import {TASKS_AND_EXAMPLES as BASE_TASKS_AND_EXAMPLES} from './tasksAndExamples';
import {AIP_TEXTBOOK_TASKS} from './aipTextbookTasks';
import {RK_THEORY_QUESTIONS} from './rkQuestions';
import {ANGEOM_RK1_AND_EXAM_QUESTIONS} from './angeomExamQuestions';
import {RK_TASKS, RK_TASK_FLASHCARDS} from './rkTasks';
import {MATAN_THEOREMS} from './matanQuestionsTheorems';
import {MATAN_DEFINITIONS} from './matanQuestionsDefs';
import {MATAN_METODICHKA_CARDS} from './matanMetodichkaCards';
import {MATAN_TASKS as BASE_MATAN_TASKS} from './matanTasks';
import {
  MATAN_EXAM_TICKET_TASKS,
  MATAN_OFFICIAL_TICKETS,
  MatanOfficialTicketSpec,
} from './matanExamTickets';
import {QuestionChapter, TaskCard, TheoryCard} from '../types/study';

export {LECTURES, LECTURE_MAP} from './lectures';
export {AIP_TEXTBOOK_QUESTIONS} from './aipTextbookQuestions';
export {AIP_TEXTBOOK_TASKS} from './aipTextbookTasks';
export {RK_THEORY_QUESTIONS} from './rkQuestions';
export {ANGEOM_RK1_AND_EXAM_QUESTIONS} from './angeomExamQuestions';
export {RK_TASKS, RK_TASK_FLASHCARDS} from './rkTasks';
export {MATAN_THEOREMS} from './matanQuestionsTheorems';
export {MATAN_DEFINITIONS} from './matanQuestionsDefs';
export {MATAN_METODICHKA_CARDS} from './matanMetodichkaCards';
export {MATAN_EXAM_TICKET_TASKS, MATAN_OFFICIAL_TICKETS};
export type {MatanOfficialTicketSpec};

export const TASKS_AND_EXAMPLES: TaskCard[] = [
  ...BASE_TASKS_AND_EXAMPLES,
  ...AIP_TEXTBOOK_TASKS,
];

export const MATAN_TASKS: TaskCard[] = [
  ...BASE_MATAN_TASKS,
  ...MATAN_EXAM_TICKET_TASKS,
];

/** Official 50 exam questions from the exam sheet (IDs 1..50) */
export const OFFICIAL_EXAM_QUESTIONS: TheoryCard[] = [
  ...EXAM_QUESTIONS_PART_1,
  ...EXAM_QUESTIONS_PART_2,
];

/** Complete built-in Exam flashcard deck: 50 official exam questions (1..50) + 12 lecture extras (51..62) + 28 C++ textbook control/RK cards (63..90) */
export const EXAM_QUESTIONS: TheoryCard[] = [
  ...EXAM_QUESTIONS_PART_1,
  ...EXAM_QUESTIONS_PART_2,
  ...EXAM_QUESTIONS_LECTURE_EXTRAS,
  ...AIP_TEXTBOOK_QUESTIONS,
];

/** Complete built-in Angeom flashcard deck: РК 2 (IDs 201..232) + РК 1 (IDs 251..290) + Экзамен лекции 1–5, 8–9 (IDs 291..302) */
export const RK_QUESTIONS: TheoryCard[] = [
  ...RK_THEORY_QUESTIONS,
  ...ANGEOM_RK1_AND_EXAM_QUESTIONS,
];

/** Complete built-in Matan exam flashcard deck: 49 exam theorems (501..549) + 48 core definitions (551..598) + 18 Metodichka MGTU cards (601..618) */
export const MATAN_QUESTIONS: TheoryCard[] = [
  ...MATAN_THEOREMS,
  ...MATAN_DEFINITIONS,
  ...MATAN_METODICHKA_CARDS,
];

export const EXAM_QUESTION_CHAPTERS: QuestionChapter[] = [
  'Глава 1 · Простейшие конструкции и ввод-вывод',
  'Глава 2 · Управляющие конструкции',
  'Глава 3 · Массивы, указатели, строки и структуры',
  'Глава 4 · Модульное программирование и рекурсия',
  'Глава 5 · Динамические списки и очереди',
  'Глава 6 · Работа с файлами и кодировки',
  'Глава 8 · Деревья и разбор выражений',
  'Учебник C++ · Теория и контроль (Гл. 1–8)',
  'Учебник C++ · Рубежный контроль (Модули 1–3)',
];

export const RK_QUESTION_CHAPTERS: QuestionChapter[] = [
  'РК 2 · Базовые теоретические вопросы',
  'РК 2 · Теория повышенной сложности (доказательства)',
  'РК 1 · Базовые вопросы (1–30)',
  'РК 1 · Доказательства и выводы (Часть Б, 1–10)',
  'Ангем Экзамен · Лекции 1–5, 8–9 (кривые и поверхности)',
];

export const MATAN_QUESTION_CHAPTERS: QuestionChapter[] = [
  'Матан · Пределы и б.м.ф. (вопр. 1–15)',
  'Матан · Непрерывность и разрывы (вопр. 16–22)',
  'Матан · Производная и дифференциал (вопр. 23–29)',
  'Матан · Теоремы о среднем, Лопиталь и Тейлор (вопр. 30–42)',
  'Матан · Монотонность, экстремумы и выпуклость (вопр. 43–49)',
  'Матан · Базовые определения (1–48)',
  'Матан · Методички МГТУ (Ч.1–3 · алгоритмы и таблицы)',
];

export const QUESTION_CHAPTERS: QuestionChapter[] = EXAM_QUESTION_CHAPTERS;


