import {EXAM_QUESTIONS_PART_1} from './examQuestionsPart1';
import {EXAM_QUESTIONS_PART_2} from './examQuestionsPart2';
import {EXAM_QUESTIONS_LECTURE_EXTRAS} from './examQuestionsExtra';
import {TASKS_AND_EXAMPLES} from './tasksAndExamples';
import {RK_THEORY_QUESTIONS} from './rkQuestions';
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
export {TASKS_AND_EXAMPLES} from './tasksAndExamples';
export {RK_THEORY_QUESTIONS} from './rkQuestions';
export {RK_TASKS, RK_TASK_FLASHCARDS} from './rkTasks';
export {MATAN_THEOREMS} from './matanQuestionsTheorems';
export {MATAN_DEFINITIONS} from './matanQuestionsDefs';
export {MATAN_METODICHKA_CARDS} from './matanMetodichkaCards';
export {MATAN_EXAM_TICKET_TASKS, MATAN_OFFICIAL_TICKETS};
export type {MatanOfficialTicketSpec};

export const MATAN_TASKS: TaskCard[] = [
  ...BASE_MATAN_TASKS,
  ...MATAN_EXAM_TICKET_TASKS,
];

/** Official 50 exam questions from the exam sheet (IDs 1..50) */
export const OFFICIAL_EXAM_QUESTIONS: TheoryCard[] = [
  ...EXAM_QUESTIONS_PART_1,
  ...EXAM_QUESTIONS_PART_2,
];

/** Complete built-in Exam flashcard deck: 50 official exam questions + 12 additional lecture sections (IDs 1..62) */
export const EXAM_QUESTIONS: TheoryCard[] = [
  ...EXAM_QUESTIONS_PART_1,
  ...EXAM_QUESTIONS_PART_2,
  ...EXAM_QUESTIONS_LECTURE_EXTRAS,
];

/** Complete built-in РК-2 theory flashcard deck: 24 basic theory + 8 advanced theory with proofs (IDs 201..232) */
export const RK_QUESTIONS: TheoryCard[] = [...RK_THEORY_QUESTIONS];

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
];

export const RK_QUESTION_CHAPTERS: QuestionChapter[] = [
  'РК 2 · Базовые теоретические вопросы',
  'РК 2 · Теория повышенной сложности (доказательства)',
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


