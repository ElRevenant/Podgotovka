import React from 'react';
import {
  BookOpen,
  Sparkles,
  Brain,
  Target,
  Calculator,
  Camera,
  Trophy,
  Flame,
  Network,
  ShieldAlert,
  GraduationCap,
  FileText,
  Keyboard,
  Download,
  Upload,
  Settings,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  WifiOff,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { AppSection, StudyCategory } from '../types/study';
import { getAutonomousMode } from '../utils/cardHelpers';

interface GuideWorkspaceProps {
  currentSubject: StudyCategory;
  subjectTitle: string;
  onSelectSection: (section: AppSection) => void;
  onStartWeakSprint: () => void;
  onOpenSettings: () => void;
  onOpenKnowledgeGraph: () => void;
  onOpenSpotTheLie: () => void;
  onOpenOralExam: () => void;
  onOpenFeynman: () => void;
  onOpenLastNight: () => void;
  onOpenCheatSheet: () => void;
  onOpenRewards: () => void;
  onExportBackup: () => void;
  onImportBackupClick: () => void;
}

export const GuideWorkspace: React.FC<GuideWorkspaceProps> = ({
  currentSubject,
  subjectTitle,
  onSelectSection,
  onStartWeakSprint,
  onOpenSettings,
  onOpenKnowledgeGraph,
  onOpenSpotTheLie,
  onOpenOralExam,
  onOpenFeynman,
  onOpenLastNight,
  onOpenCheatSheet,
  onOpenRewards,
  onExportBackup,
  onImportBackupClick,
}) => {
  const isAutonomous = getAutonomousMode();
  const subjectName =
    currentSubject === 'matan'
      ? 'Математический анализ'
      : currentSubject === 'rk'
      ? 'Аналитическая геометрия (РК 2)'
      : currentSubject === 'exam'
      ? 'Алгоритмизация и программирование (АИП)'
      : subjectTitle;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="dt-surface rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-cyan-500/20">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Гайд для друзей · Зимняя сессия
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Как подготовиться к экзамену ({subjectName}) на максимум
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Здесь собрана вся теория, реальные задачи из билетов, интерактивный черновик в клетку, алгоритм интервального повторения SM-2 и тренажёры устной сдачи. Никакой регистрации — открой и сразу учи.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onSelectSection('flashcards')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Перейти к карточкам
            </button>
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              Открыть Настройки
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Быстрый старт за 1 минуту */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold inline-flex items-center justify-center">
                1
              </span>
              Быстрый старт за 1 минуту
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Три главные вещи, которые нужно знать перед началом подготовки
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="dt-surface rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                1. У каждого свой личный прогресс
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Никаких аккаунтов и паролей: все твои оценки карточек, серия дней, заметки, решения на черновике и открытые достижения сохраняются локально в браузере (<code className="text-emerald-300 font-mono">localStorage</code>) отдельно по каждому предмету: <strong>Матан</strong>, <strong>Ангем РК 2</strong> и <strong>АИП</strong>.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Твой прогресс не смешивается с друзьями
            </div>
          </div>

          {/* Card 2 */}
          <div className="dt-surface rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                2. Как учить по алгоритму SM-2
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Открывай <strong>«Теория»</strong>, читай вопрос, пробуй ответить вслух или письменно, нажимай <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">Пробел</kbd> для переворота и честно оценивай себя клавишами <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">1..4</kbd> («Снова», «Трудно», «Хорошо», «Легко»).
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Слабые темы уходят в повтор</span>
              <button
                onClick={onStartWeakSprint}
                className="text-xs font-bold text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 cursor-pointer"
              >
                Спринт по слабым <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="dt-surface rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  {isAutonomous ? <WifiOff className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    isAutonomous
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {isAutonomous ? 'Автономный режим' : 'Серверный ИИ активен ✓'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                3. Как работает ИИ и Автономный режим
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Базовые карточки, задачи, формулы, шпаргалка, дерево навыков и локальная проверка ответов по смысловым тезисам работают <strong>на 100% автономно и без VPN</strong>. В настройках можно переключать серверный ИИ и автономный режим в один клик.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={onOpenSettings}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                Открыть Настройки режима
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Что даёт каждый режим */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold inline-flex items-center justify-center">
              2
            </span>
            Что даёт каждый режим тренажёра
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Нажми «Запустить →» на любой карточке, чтобы сразу перейти к нужному инструменту
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Теория и Спринт по слабым */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  База + SM-2
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Теория и Спринт по слабым
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Карточки с определениями, теоремами, доказательствами, геометрическим смыслом и ловушками лектора. Голосовой или письменный ответ сразу сверяется с эталонными тезисами.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onSelectSection('flashcards')}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Запустить <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onStartWeakSprint}
                className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Спринт по слабым карточкам"
              >
                Спринт
              </button>
            </div>
          </div>

          {/* 2. Задачи, Черновик в клетку и Проверка по фото */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-emerald-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Calculator className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-emerald-400" /> Практика
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Задачи, Черновик и Фото-проверка
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Реальные задачи из билетов и РК с пошаговыми подсказками, встроенным холстом-черновиком в клетку (поддерживает стилус и мышь) и загрузкой фото рукописного решения.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onSelectSection('tasks')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Запустить <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Симулятор реального билета */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-indigo-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Target className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Экзамен + Блиц
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Симулятор реального билета
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Генерирует полноценный экзаменационный билет с таймером без подсказок или быстрый блиц-тест. В конце выдаёт честный разбор по каждому пункту билета.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onSelectSection('simulator')}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Билет <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectSection('quiz')}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Блиц
              </button>
            </div>
          </div>

          {/* 4. Дерево навыков и Эффект домино */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Network className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Граф связей
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Дерево навыков и Эффект домино
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Показывает, какие базовые темы блокируют понимание следующих разделов, и строит персональный маршрут из 3–4 приоритетных узлов для закрытия пробелов.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={onOpenKnowledgeGraph}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Запустить <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 5. Найди ложь за 30 секунд */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-rose-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Анти-ловушки
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Найди ложь за 30 секунд
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Из 3 правдоподобных математических или алгоритмических утверждений одно содержит тонкую ошибку в кванторе, знаке или граничном условии. Найди её до истечения таймера!
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={onOpenSpotTheLie}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Запустить <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6. Устный экзамен и Метод Фейнмана */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-amber-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Устная защита
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Устный экзамен и Метод Фейнмана
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Два диалоговых режима: сдача билета строгому, но справедливому профессору с каверзными вопросами на засыпку или объяснение темы «Первокурснику Дане» простыми словами.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={onOpenOralExam}
                className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                Профессор <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={onOpenFeynman}
                className="py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Фейнман
              </button>
            </div>
          </div>

          {/* 7. Ночь перед экзаменом и Шпаргалка + PDF */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-purple-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Flame className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Экспресс
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Ночь перед экзаменом и Шпаргалка
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Выжимка самых частых формул, алгоритмов и опасных вопросов, плюс полная методичка, конспекты и официальные PDF-варианты прошлых лет.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={onOpenLastNight}
                className="flex-1 py-2 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                Ночь <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={onOpenCheatSheet}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Шпаргалка
              </button>
              <button
                onClick={() => onSelectSection('lectures')}
                className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          {/* 8. Награды XP и Достижения */}
          <div className="dt-surface rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between gap-4 hover:border-amber-500/30 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Trophy className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Анти-тильт
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Награды XP и Зал достижений
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Зарабатывай XP за карточки, задачи и экзамены, открывай 45+ ачивок, используй «Анти-тильт передышку» при усталости и получай честные награды за выполненный план.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={onOpenRewards}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Запустить <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Горячие клавиши и фишки */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold inline-flex items-center justify-center">
              3
            </span>
            Горячие клавиши, бэкап прогресса и установка на телефон
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Полезные фишки для быстрой учёбы с ноутбука или смартфона в метро
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hotkeys Table */}
          <div className="dt-surface rounded-2xl p-5 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              Горячие клавиши на ПК
            </div>
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-300">Перевернуть карточку</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                  Пробел
                </kbd>
              </div>
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-300">Оценить карточку (Снова..Легко)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                  1 – 4
                </kbd>
              </div>
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-300">Предыдущая / следующая</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                  ← / →
                </kbd>
              </div>
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-300">Показать подсказку лектора</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                  H
                </kbd>
              </div>
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-300">Отправить ответ на проверку</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                  Ctrl + Enter
                </kbd>
              </div>
            </div>
          </div>

          {/* JSON Backup Import/Export */}
          <div className="dt-surface rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                <Download className="w-4 h-4 text-emerald-400" />
                Перенос прогресса между устройствами
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Хочешь начать учить на ноутбуке, а продолжить в метро с телефона? Экспортируй свой прогресс в JSON-файл в один клик и загрузи его на другом устройстве.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                В JSON-бэкап входят все оценки SM-2, решённые задачи, XP, достижения и заметки по всем предметам.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={onExportBackup}
                className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать JSON
              </button>
              <button
                onClick={onImportBackupClick}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Загрузить JSON
              </button>
            </div>
          </div>

          {/* PWA Mobile & Desktop Install Guide */}
          <div className="dt-surface rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Как установить как приложение (PWA)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Сайт поддерживает полноценную установку на домашний экран смартфона или ПК и работает даже при нестабильном интернете:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>
                    <strong>iOS (Safari):</strong> нажми кнопку <em>«Поделиться»</em> внизу экрана → выбери <em>«На экран „Домой“»</em>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>
                    <strong>Android (Chrome):</strong> открой меню <em>«⋮»</em> в правом верхнем углу → <em>«Установить приложение»</em>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>ПК (Chrome / Edge):</strong> нажми на иконку установки справа в адресной строке браузера.
                  </span>
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Удачи на зимней сессии! Закрывай карточки шаг за шагом.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
