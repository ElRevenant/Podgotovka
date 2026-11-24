import {FormEvent, useState} from 'react';
import {Plus, X} from 'lucide-react';
import {
  EXAM_QUESTION_CHAPTERS,
  LECTURES,
  MATAN_QUESTION_CHAPTERS,
  RK_QUESTION_CHAPTERS,
} from '../data';
import {
  LectureId,
  QuestionChapter,
  StudyCategory,
  TheoryCard,
} from '../types/study';

interface CustomCardModalProps {
  category: StudyCategory;
  nextId: number;
  onSave: (card: TheoryCard) => void;
  onClose: () => void;
}

export function CustomCardModal({
  category,
  nextId,
  onSave,
  onClose,
}: CustomCardModalProps) {
  const availableChapters: QuestionChapter[] =
    category === 'rk'
      ? [...RK_QUESTION_CHAPTERS]
      : category === 'matan'
        ? [...MATAN_QUESTION_CHAPTERS]
        : category.startsWith('custom_')
          ? ['Основной раздел', 'Теория и определения', 'Формулы и задачи']
          : [...EXAM_QUESTION_CHAPTERS];
  const availableLectures =
    category === 'rk'
      ? LECTURES.filter((l) => l.category === 'rk')
      : category === 'matan'
        ? LECTURES.filter((l) => l.category === 'matan')
        : LECTURES.filter((l) => l.category !== 'rk' && l.category !== 'matan');

  const isMathCategory =
    category === 'rk' || category === 'matan' || category.startsWith('custom_');

  const [question, setQuestion] = useState('');
  const [chapter, setChapter] = useState<QuestionChapter>(availableChapters[0]);
  const [keyThesis, setKeyThesis] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [codeTitle, setCodeTitle] = useState(
    isMathCategory ? 'Формула / ход доказательства' : 'Пример кода C/C++',
  );
  const [codeBody, setCodeBody] = useState('');
  const [examTip, setExamTip] = useState('');
  const [hint, setHint] = useState('');
  const [quizKeyword, setQuizKeyword] = useState('');
  const [lectureId, setLectureId] = useState<LectureId>(
    category === 'rk'
      ? 'rk2_angeom'
      : category === 'matan'
        ? 'matan_theory'
        : 'lec1',
  );
  const [slidePage, setSlidePage] = useState<number>(1);
  const [slideLabel, setSlideLabel] = useState<string>('Слайд конспекта');
  const [error, setError] = useState('');

  const selectedLecture =
    LECTURES.find((l) => l.id === lectureId) ?? availableLectures[0] ?? LECTURES[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const qClean = question.trim();
    const thesisClean = keyThesis.trim();
    if (!qClean || !thesisClean) {
      setError('Заполните формулировку вопроса и главный тезис ответа.');
      return;
    }

    const answerPoints = pointsText
      .split('\n')
      .map((line) => line.replace(/^\s*[-•\d.)]+\s*/, '').trim())
      .filter(Boolean);

    const safePage = Math.max(
      1,
      Math.min(Number(slidePage) || 1, selectedLecture.pageCount),
    );

    const newCard: TheoryCard = {
      id: nextId,
      category,
      badgeLabel: `Своя карточка №${nextId}`,
      question: qClean,
      chapter,
      keyThesis: thesisClean,
      answerPoints:
        answerPoints.length > 0 ? answerPoints : [thesisClean],
      codeSnippet: codeBody.trim()
        ? {
            title:
              codeTitle.trim() ||
              (isMathCategory ? 'Математическая запись' : 'Пример кода'),
            code: codeBody.trim(),
          }
        : undefined,
      examTip:
        examTip.trim() ||
        'Обратите внимание на точную формулировку и граничные случаи при ответе.',
      hint: hint.trim() || undefined,
      quizKeyword: quizKeyword.trim() || undefined,
      slides: [
        {
          lectureId,
          page: safePage,
          label: slideLabel.trim() || `${selectedLecture.shortTitle}, с. ${safePage}`,
          isAnswerSlide: true,
        },
      ],
      coverage: 'custom',
      isCustom: true,
    };

    onSave(newCard);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Добавить свою карточку"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522]">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Добавить свою карточку в колоду (№ {nextId})
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Карточка сохраняется в браузере, участвует в SM-2 повторении и блиц-тестах
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/60 dark:text-[#94A3B8] dark:hover:bg-[#182235] transition-colors cursor-pointer"
            aria-label="Закрыть окно"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
              Вопрос или термин (лицевая сторона) *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Например: Отличие передачи параметра по указателю и по ссылке"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Глава курса
              </label>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value as QuestionChapter)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {availableChapters.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Ключевой термин (для Блиц-теста)
              </label>
              <input
                type="text"
                value={quizKeyword}
                onChange={(e) => setQuizKeyword(e.target.value)}
                placeholder="Например: nullptr"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
              Главный тезис ответа (выделяется жирным на обороте) *
            </label>
            <textarea
              rows={2}
              value={keyThesis}
              onChange={(e) => setKeyThesis(e.target.value)}
              placeholder="Краткое чёткое определение в 1–2 предложениях, которое нужно сказать первым..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
              Детали ответа списком (каждый пункт с новой строки)
            </label>
            <textarea
              rows={4}
              value={pointsText}
              onChange={(e) => setPointsText(e.target.value)}
              placeholder={'Первый пункт ответа\nВторой пункт ответа\nТретий пункт ответа'}
              className="w-full px-3 py-2 text-xs leading-relaxed rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Подсказка на лицевой стороне (необязательно)
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Наводящий вопрос без спойлера..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Ловушка на экзамене (необязательно)
              </label>
              <input
                type="text"
                value={examTip}
                onChange={(e) => setExamTip(e.target.value)}
                placeholder="Частая ошибка студентов..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-[#D1D5DB]">
                {isMathCategory
                  ? 'Формула / план доказательства (необязательно)'
                  : 'Пример кода C/C++ (необязательно)'}
              </label>
              <input
                type="text"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                placeholder="Заголовок блока"
                className="px-2 py-0.5 text-xs rounded border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-700 dark:text-[#D1D5DB]"
              />
            </div>
            <textarea
              rows={3}
              value={codeBody}
              onChange={(e) => setCodeBody(e.target.value)}
              placeholder={
                isMathCategory
                  ? 'lim_{x -> 0} (sin x)/x = 1'
                  : 'int *p = &a;'
              }
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Привязать PDF лекции
              </label>
              <select
                value={lectureId}
                onChange={(e) => {
                  setLectureId(e.target.value as LectureId);
                  setSlidePage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6]"
              >
                {availableLectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.shortTitle} ({l.pageCount} с.)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Номер слайда (1..{selectedLecture.pageCount})
              </label>
              <input
                type="number"
                min={1}
                max={selectedLecture.pageCount}
                value={slidePage}
                onChange={(e) => setSlidePage(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                Подпись к слайду
              </label>
              <input
                type="text"
                value={slideLabel}
                onChange={(e) => setSlideLabel(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg prism-cta transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Сохранить карточку</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
