import {useState} from 'react';
import {Download, MonitorSmartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="prism-tool-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
        title="Установить как отдельное приложение на ПК или телефон (работает офлайн)"
      >
        <Download className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
        <span className="hidden 2xl:inline">Установить</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="prism-tool-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
        title="Как установить приложение на рабочий стол ПК или экран телефона"
      >
        <MonitorSmartphone className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
        <span className="hidden 2xl:inline">На экран</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Установка приложения на ПК или телефон"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
                Установка как отдельная программа (PWA)
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:bg-[#182235] cursor-pointer"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB] list-decimal pl-5">
                <li>
                  Откройте приложение напрямую в <strong>Safari</strong>.
                </li>
                <li>
                  Нажмите кнопку <strong>Поделиться</strong> (квадрат со стрелкой вверх) на нижней панели.
                </li>
                <li>
                  Выберите пункт <strong>«На экран «Домой»»</strong> и нажмите <strong>Добавить</strong>.
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB]">
                <p>
                  Приложение поддерживает установку в отдельное окно (как <span className="font-mono">.exe</span>, без адресной строки браузера) и офлайн-работу с карточками и PDF:
                </p>
                <ol className="space-y-1.5 list-decimal pl-5">
                  <li>
                    Откройте ссылку приложения в новой вкладке <strong>Chrome</strong> или <strong>Microsoft Edge</strong>.
                  </li>
                  <li>
                    Нажмите значок <strong>«Установить приложение»</strong> в правой части адресной строки (или меню ⋮ → <em>Сохранить и поделиться → Установить страницу как приложение</em>).
                  </li>
                  <li>
                    Ярлык появится на рабочем столе Windows / в меню «Пуск».
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
