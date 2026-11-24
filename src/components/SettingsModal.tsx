import {useEffect, useState} from 'react';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Flame,
  Moon,
  PartyPopper,
  RotateCcw,
  Settings,
  Snowflake,
  Sparkles,
  Sun,
  Target,
  Upload,
  X,
} from 'lucide-react';
import {AppPreferences, StudyPlannerSettings} from '../types/study';
import {getAutonomousMode, setAutonomousMode} from '../utils/cardHelpers';
import {PWAInstallButton} from './PWAInstallButton';

interface SettingsModalProps {
  preferences: AppPreferences;
  plannerSettings: StudyPlannerSettings;
  theme: 'dark' | 'light';
  onUpdatePreferences: (patch: Partial<AppPreferences>) => void;
  onResetPreferences: () => void;
  onUpdatePlanner: (patch: Partial<StudyPlannerSettings>) => void;
  onChangeTheme: (theme: 'dark' | 'light') => void;
  onExportNow: () => void;
  onImportClick: () => void;
  onClose: () => void;
}

const FOCUS_PRESETS: ReadonlyArray<{
  label: string;
  focus: number;
  brk: number;
}> = [
  {label: '25 / 5', focus: 25, brk: 5},
  {label: '45 / 10', focus: 45, brk: 10},
  {label: '50 / 10', focus: 50, brk: 10},
  {label: '90 / 15', focus: 90, brk: 15},
];

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#121926] border border-slate-200/80 dark:border-white/[0.1] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-[#F8FAFC]">
            {title}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-snug mt-0.5">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
          checked
            ? 'bg-emerald-500/85 border-emerald-400/70'
            : 'bg-slate-200 dark:bg-[#121926] border-slate-300 dark:border-white/[0.15]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsModal({
  preferences,
  plannerSettings,
  theme,
  onUpdatePreferences,
  onResetPreferences,
  onUpdatePlanner,
  onChangeTheme,
  onExportNow,
  onImportClick,
  onClose,
}: SettingsModalProps) {
  const [autonomousMode, setAutonomousModeState] =
    useState<boolean>(getAutonomousMode);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleToggleAutonomousMode = () => {
    const next = !autonomousMode;
    setAutonomousMode(next);
    setAutonomousModeState(next);
  };

  const handleFocusInput = (val: string) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(5, Math.min(120, Math.round(n)));
    onUpdatePreferences({focusMinutes: clamped});
  };

  const handleBreakInput = (val: string) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(45, Math.round(n)));
    onUpdatePreferences({breakMinutes: clamped});
  };

  const handleDailyGoalInput = (val: string) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(5, Math.min(100, Math.round(n)));
    onUpdatePlanner({dailyGoal: clamped});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Настройки приложения"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-[20px] border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#121926] border border-slate-200/80 dark:border-white/[0.12] flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Settings className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-950 dark:text-[#F8FAFC]">
                Настройки
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Режим проверки ответов, зимняя атмосфера, фокус-таймер и резервные копии
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки"
            className="prism-tool-btn p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 0: Server AI Proxy & Seamless Autonomous Mode for Friends */}
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-[#E2E8F0]">
                Режим ИИ-экзаменатора и Автономная проверка
              </h3>
              {!autonomousMode ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Серверный ИИ активен ✓</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/80 dark:bg-white/[0.08] border border-slate-300 dark:border-white/[0.14] text-slate-700 dark:text-[#CBD5E1]">
                  <Cpu className="h-3 w-3 text-cyan-500" />
                  <span>Автономный режим (локальная проверка)</span>
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B111C]/70 p-4 space-y-3">
              <ToggleRow
                icon={<Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                title="Автономный режим (100% локальная проверка без сети)"
                description="Мгновенная оценка устных ответов и диалогов по смысловым тезисам карточки прямо в браузере"
                checked={autonomousMode}
                onToggle={handleToggleAutonomousMode}
              />

              <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] space-y-1.5 text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                <p>
                  <strong className="text-slate-800 dark:text-[#E2E8F0]">1) Автономный режим:</strong>{' '}
                  работают все карточки SM-2, задачи, PDF, графики, дерево навыков, блиц-тесты, голосовой ввод браузера и локальная проверка ответов по смысловым тезисам.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-[#E2E8F0]">2) Работа без VPN для друзей:</strong>{' '}
                  все обращения к ИИ-экзаменатору, методу Фейнмана и проверке фото идут через встроенный сервер сайта — друзьям не нужно включать VPN или настраивать доступ вручную.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-[#E2E8F0]">3) Бесшовная страховка:</strong>{' '}
                  даже при пиковой нагрузке или отсутствии интернета все тренажёры автоматически переключаются на локальный диалог по шагам карточки без ошибок и потери прогресса.
                </p>
              </div>
            </div>
          </section>

          {/* Section 1: Atmosphere & UI */}
          <section className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-[#E2E8F0]">
                Атмосфера и интерфейс
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <PWAInstallButton />
                <div className="inline-flex items-center gap-1 p-0.5 rounded-full border border-slate-200/80 dark:border-white/[0.1] bg-slate-100/80 dark:bg-[#121926]">
                  <button
                    type="button"
                    onClick={() => onChangeTheme('dark')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                      theme === 'dark'
                        ? 'prism-tab-active font-semibold'
                        : 'text-slate-600 dark:text-[#94A3B8]'
                    }`}
                  >
                    <Moon className="h-3 w-3" />
                    <span>Тёмная</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeTheme('light')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-colors ${
                      theme === 'light'
                        ? 'prism-tab-active font-semibold'
                        : 'text-slate-600 dark:text-[#94A3B8]'
                    }`}
                  >
                    <Sun className="h-3 w-3" />
                    <span>Светлая</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B111C]/70 px-4 py-1">
              <ToggleRow
                icon={<Snowflake className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                title="Снег на фоне (заблюренный)"
                description="Мягкое падение размытых снежинок позади карточек"
                checked={preferences.snowEnabled}
                onToggle={() =>
                  onUpdatePreferences({snowEnabled: !preferences.snowEnabled})
                }
              />
              <ToggleRow
                icon={<Flame className="h-4 w-4 text-amber-500 dark:text-amber-300" />}
                title="Тёплое свечение настольной лампы"
                description="Органичная тёплая подсветка на фоне и в углу активной карточки"
                checked={preferences.warmGlowEnabled}
                onToggle={() =>
                  onUpdatePreferences({
                    warmGlowEnabled: !preferences.warmGlowEnabled,
                  })
                }
              />
              <ToggleRow
                icon={<PartyPopper className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                title="Зимний салют из конфетти за награды"
                description="Праздничный залп при открытии и получении нового допуска или достижения"
                checked={preferences.confettiEnabled}
                onToggle={() =>
                  onUpdatePreferences({
                    confettiEnabled: !preferences.confettiEnabled,
                  })
                }
              />
              <ToggleRow
                icon={<Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />}
                title="Показывать XP в верхней шапке"
                description="Закреплённый счётчик опыта рядом со «Статистикой»"
                checked={preferences.showXpInHeader}
                onToggle={() =>
                  onUpdatePreferences({
                    showXpInHeader: !preferences.showXpInHeader,
                  })
                }
              />
            </div>
          </section>

          {/* Section 2: Focus Timer & Daily Goal */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-[#E2E8F0]">
              Фокус-таймер и ритм подготовки
            </h3>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B111C]/70 p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                  Быстрые пресеты (фокус / чай-перерыв, мин)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_PRESETS.map((preset) => {
                    const active =
                      preferences.focusMinutes === preset.focus &&
                      preferences.breakMinutes === preset.brk;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          onUpdatePreferences({
                            focusMinutes: preset.focus,
                            breakMinutes: preset.brk,
                          });
                          onUpdatePlanner({
                            pomodoroMode: preset.focus >= 50 ? '50/10' : '25/5',
                          });
                        }}
                        className={`px-3 py-1.5 text-xs font-mono tabular-nums rounded-full transition-colors cursor-pointer ${
                          active
                            ? 'prism-tab-active font-semibold'
                            : 'prism-tool-btn text-slate-700 dark:text-[#CBD5E1]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-[#CBD5E1]">
                    <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    Фокус (мин)
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    value={preferences.focusMinutes}
                    onChange={(e) => handleFocusInput(e.target.value)}
                    className="prism-input w-full h-9 px-3 text-xs font-mono tabular-nums rounded-xl text-slate-900 dark:text-[#F8FAFC]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-[#CBD5E1]">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Чай / Отдых (мин)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={45}
                    step={1}
                    value={preferences.breakMinutes}
                    onChange={(e) => handleBreakInput(e.target.value)}
                    className="prism-input w-full h-9 px-3 text-xs font-mono tabular-nums rounded-xl text-slate-900 dark:text-[#F8FAFC]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-[#CBD5E1]">
                    <Target className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
                    Цель дня (карт.)
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    step={5}
                    value={plannerSettings.dailyGoal}
                    onChange={(e) => handleDailyGoalInput(e.target.value)}
                    className="prism-input w-full h-9 px-3 text-xs font-mono tabular-nums rounded-xl text-slate-900 dark:text-[#F8FAFC]"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 3: Manual JSON Backup */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-[#E2E8F0]">
              Резервная копия прогресса (JSON)
            </h3>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B111C]/70 p-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Весь ваш прогресс SM-2, решённые задачи, заметки, XP и достижения мгновенно сохраняются в браузере (<code className="font-mono text-[11px]">localStorage</code>). Для переноса на другое устройство сохраните или загрузите JSON-файл вручную:
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onExportNow}
                  className="prism-cta inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Сохранить JSON сейчас</span>
                </button>
                <button
                  type="button"
                  onClick={onImportClick}
                  className="prism-tool-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full text-slate-800 dark:text-[#E5E7EB] cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Загрузить из JSON</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B111C]/60">
          <button
            type="button"
            onClick={onResetPreferences}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Сбросить настройки по умолчанию</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="prism-tool-btn px-4 py-1.5 text-xs font-semibold rounded-full text-slate-800 dark:text-[#F8FAFC] cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
