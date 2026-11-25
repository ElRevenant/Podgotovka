import {useState, useEffect} from 'react';
import {
  X,
  Cpu,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Terminal,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CppMemoryTracerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemoryBlockView {
  label: string;
  address?: string;
  segment: 'STACK' | 'HEAP' | 'CODE';
  highlight?: 'active' | 'mutated' | 'deleted' | 'normal';
  cells: {
    key: string;
    value: string;
    active?: boolean;
    badge?: string;
  }[];
}

interface TracerStep {
  title: string;
  activeLine: number; // 1-indexed line in scenario.codeLines
  commentary: string;
  consoleOutput?: string;
  blocks: MemoryBlockView[];
}

interface CppScenario {
  id: string;
  shortTitle: string;
  fullTitle: string;
  badge: string;
  codeLines: string[];
  steps: TracerStep[];
}

const CPP_SCENARIOS: CppScenario[] = [
  // ==========================================================================
  // SCENARIO 1: Сортировка строк матрицы по суммам (Билет №1 АИП)
  // ==========================================================================
  {
    id: 'matrix-row-sort',
    shortTitle: '1. Сортировка строк матрицы (Билет №1)',
    fullTitle: 'Экзаменационная задача №1: Подсчёт сумм строк a[n][m] и синхронный пузырьковый обмен',
    badge: 'Двумерные массивы · Пузырёк',
    codeLines: [
      'int a[3][3] = {{4, 5, 3}, {1, 2, 1}, {2, 3, 2}};',
      'int b[3] = {0, 0, 0};',
      'for (int i = 0; i < 3; i++)',
      '  for (int j = 0; j < 3; j++) b[i] += a[i][j];',
      '// Пузырьковый проход по массиву сумм b[]:',
      'if (b[i] > b[i + 1]) {',
      '  int c = b[i]; b[i] = b[i + 1]; b[i + 1] = c;',
      '  for (int j = 0; j < 3; j++) {',
      '    int tmp = a[i][j]; a[i][j] = a[i+1][j]; a[i+1][j] = tmp;',
      '  }',
      '}',
    ],
    steps: [
      {
        title: 'Шаг 1. Инициализация матрицы a[3][3] и массива сумм b[3]',
        activeLine: 1,
        commentary:
          'В стеке функции выделена матрица a[3][3] (3 строки по 3 числа) и обнулённый массив сумм строк b[3].',
        blocks: [
          {
            label: 'Матрица a[3][3] в стеке',
            segment: 'STACK',
            cells: [
              {key: 'Строка a[0]', value: '[ 4,  5,  3 ]', badge: 'сумма = ?'},
              {key: 'Строка a[1]', value: '[ 1,  2,  1 ]', badge: 'сумма = ?'},
              {key: 'Строка a[2]', value: '[ 2,  3,  2 ]', badge: 'сумма = ?'},
            ],
          },
          {
            label: 'Вспомогательный массив сумм b[3]',
            segment: 'STACK',
            cells: [
              {key: 'b[0]', value: '0'},
              {key: 'b[1]', value: '0'},
              {key: 'b[2]', value: '0'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 2. Предвычисление сумм каждой строки в массив b[i]',
        activeLine: 4,
        commentary:
          'Двойным циклом считаем сумму элементов каждой строки один раз: b[0] = 4+5+3 = 12, b[1] = 1+2+1 = 4, b[2] = 2+3+2 = 7.',
        blocks: [
          {
            label: 'Матрица a[3][3]',
            segment: 'STACK',
            cells: [
              {key: 'Строка a[0]', value: '[ 4,  5,  3 ]', badge: 'b[0] = 12'},
              {key: 'Строка a[1]', value: '[ 1,  2,  1 ]', badge: 'b[1] = 4'},
              {key: 'Строка a[2]', value: '[ 2,  3,  2 ]', badge: 'b[2] = 7'},
            ],
          },
          {
            label: 'Массив сумм b[3] заполнен',
            segment: 'STACK',
            highlight: 'mutated',
            cells: [
              {key: 'b[0]', value: '12', active: true},
              {key: 'b[1]', value: '4', active: true},
              {key: 'b[2]', value: '7', active: true},
            ],
          },
        ],
      },
      {
        title: 'Шаг 3. Сравнение соседних сумм при i = 0: b[0] > b[1] (12 > 4)',
        activeLine: 6,
        commentary:
          'Сумма нулевой строки b[0] = 12 больше суммы первой строки b[1] = 4. Условие истинно — нужен синхронный обмен!',
        blocks: [
          {
            label: 'Сравнение в массиве b[3]',
            segment: 'STACK',
            highlight: 'active',
            cells: [
              {key: 'b[0]', value: '12', active: true, badge: '12 > 4 (TRUE)'},
              {key: 'b[1]', value: '4', active: true, badge: 'нужен обмен'},
              {key: 'b[2]', value: '7'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 4. Обмен самих сумм b[0] ↔ b[1] и поэлементный обмен строк a[0][j] ↔ a[1][j]',
        activeLine: 9,
        commentary:
          'КРИТИЧЕСКИЙ МОМЕНТ: мы сначала меняем местами b[0] и b[1] (теперь b = {4, 12, 7}), а затем в цикле j = 0..2 меняем местами все элементы строк a[0][j] и a[1][j]!',
        blocks: [
          {
            label: 'Матрица a[3][3] после обмена строк 0 и 1',
            segment: 'STACK',
            highlight: 'mutated',
            cells: [
              {key: 'Строка a[0]', value: '[ 1,  2,  1 ]', active: true, badge: 'новая строка 0'},
              {key: 'Строка a[1]', value: '[ 4,  5,  3 ]', active: true, badge: 'новая строка 1'},
              {key: 'Строка a[2]', value: '[ 2,  3,  2 ]'},
            ],
          },
          {
            label: 'Массив сумм b[3] синхронизирован',
            segment: 'STACK',
            highlight: 'mutated',
            cells: [
              {key: 'b[0]', value: '4', active: true},
              {key: 'b[1]', value: '12', active: true},
              {key: 'b[2]', value: '7'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 5. Следующий шаг i = 1: b[1] > b[2] (12 > 7) → финальный порядок!',
        activeLine: 9,
        commentary:
          'При i = 1 сравниваем обновлённый b[1] = 12 и b[2] = 7. Снова меняем b[1]↔b[2] и строки a[1]↔a[2]. Итог: строки отсортированы по возрастанию сумм (4 ≤ 7 ≤ 12)!',
        consoleOutput: 'Строка 0 (сумма 4): 1 2 1 | Строка 1 (сумма 7): 2 3 2 | Строка 2 (сумма 12): 4 5 3',
        blocks: [
          {
            label: 'Отсортированная матрица a[3][3]',
            segment: 'STACK',
            highlight: 'mutated',
            cells: [
              {key: 'Строка a[0]', value: '[ 1,  2,  1 ]', badge: 'сумма 4'},
              {key: 'Строка a[1]', value: '[ 2,  3,  2 ]', active: true, badge: 'сумма 7'},
              {key: 'Строка a[2]', value: '[ 4,  5,  3 ]', active: true, badge: 'сумма 12'},
            ],
          },
          {
            label: 'Массив сумм b[3]',
            segment: 'STACK',
            cells: [
              {key: 'b[0]', value: '4'},
              {key: 'b[1]', value: '7', active: true},
              {key: 'b[2]', value: '12', active: true},
            ],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // SCENARIO 2: Посимвольный разбор C-строки char[] (Билет №2 АИП)
  // ==========================================================================
  {
    id: 'cstring-word-scan',
    shortTitle: '2. Разбор C-строки char[] (Билет №2)',
    fullTitle: 'Экзаменационная задача №2: Поиск слов, где первая буква равна последней (src[start] == src[end])',
    badge: 'Строки char[] · Нуль-терминатор \\0',
    codeLines: [
      'char src[] = " radar  cat  level ";',
      'int i = 0, k = 0; char res[40];',
      'while (src[i] != \'\\0\') {',
      '  while (src[i] == \' \') i++; // пропуск пробелов',
      '  if (src[i] == \'\\0\') break;',
      '  int start = i;',
      '  while (src[i] != \' \' && src[i] != \'\\0\') i++;',
      '  int end = i - 1;',
      '  if (src[start] == src[end]) copyWord(res, k, src, start, end);',
      '}',
      'res[k] = \'\\0\'; // ОБЯЗАТЕЛЬНЫЙ нуль-терминатор!',
    ],
    steps: [
      {
        title: 'Шаг 1. Размещение C-строки в памяти с завершающим байтом \\0',
        activeLine: 1,
        commentary:
          'В массиве char src[] каждый символ занимает 1 байт, а в самом конце компилятор автоматически дописывает нуль-терминатор \'\\0\' (код 0).',
        blocks: [
          {
            label: 'Массив char src[] в стеке',
            segment: 'STACK',
            cells: [
              {key: 'индексы 0..6', value: "' '  'r'  'a'  'd'  'a'  'r'  ' '"},
              {key: 'индексы 7..12', value: "' '  'c'  'a'  't'  ' '  ' '"},
              {key: 'индексы 13..19', value: "'l'  'e'  'v'  'e'  'l'  ' '  '\\0'", badge: 'конец строки'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 2. Выделение первого слова "radar": start = 1, end = 5',
        activeLine: 8,
        commentary:
          'Пропускаем ведущий пробел src[0], фиксируем start = 1 (\'r\'), шагаем до пробела на индексе 6 → получаем end = i - 1 = 5 (\'r\').',
        blocks: [
          {
            label: 'Границы первого слова [start..end]',
            segment: 'STACK',
            highlight: 'active',
            cells: [
              {key: 'start = 1', value: "src[1] = 'r'", active: true},
              {key: 'end = 5', value: "src[5] = 'r'", active: true},
              {key: 'Проверка', value: "src[1] == src[5] ('r' == 'r') -> TRUE!", badge: 'совпало'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 3. Проверка второго слова "cat": start = 8, end = 10',
        activeLine: 9,
        commentary:
          'Цикл while(src[i] == \' \') безопасно перепрыгивает ДВА пробела подряд (индексы 6 и 7)! Для слова "cat": src[8]=\'c\', src[10]=\'t\' — не равны, пропускаем.',
        blocks: [
          {
            label: 'Границы второго слова [8..10]',
            segment: 'STACK',
            cells: [
              {key: 'start = 8', value: "src[8] = 'c'", active: true},
              {key: 'end = 10', value: "src[10] = 't'", active: true},
              {key: 'Проверка', value: "'c' != 't' -> слово пропускается", badge: 'мимо'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 4. Третье слово "level" и запись финального \'\\0\' в res[k]',
        activeLine: 11,
        commentary:
          'Слово "level" (start=13 \'l\', end=17 \'l\') копируется в буфер res[]. В самом конце ОБЯЗАТЕЛЬНО записываем res[k] = \'\\0\', иначе при выводе на экран пойдёт мусор из стека!',
        consoleOutput: 'Результат res: "radar level"',
        blocks: [
          {
            label: 'Результирующий буфер char res[]',
            segment: 'STACK',
            highlight: 'mutated',
            cells: [
              {key: 'res[0..4]', value: "'r' 'a' 'd' 'a' 'r'"},
              {key: 'res[5..10]', value: "' ' 'l' 'e' 'v' 'e' 'l'"},
              {key: 'res[11]', value: "'\\0' (код 0)", active: true, badge: 'терминатор записан'},
            ],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // SCENARIO 3: Стек (LIFO) vs Очередь (FIFO) в динамической памяти (Куче)
  // ==========================================================================
  {
    id: 'stack-vs-queue-heap',
    shortTitle: '3. Стек (LIFO) и Очередь (FIFO) в Куче',
    fullTitle: 'Динамические списки в Куче: переброска указателей new Node и безопасное удаление delete',
    badge: 'Указатели · Heap · LIFO vs FIFO',
    codeLines: [
      'struct Node { int inf; Node* next; };',
      '// 1) Вставка в СТЕК (LIFO — перед вершиной top):',
      'Node* q = new Node; q->inf = x;',
      'q->next = top; top = q;',
      '// 2) Вставка в ОЧЕРЕДЬ (FIFO — в хвост last):',
      'Node* r = new Node; r->inf = x; r->next = nullptr;',
      'if (last) last->next = r; else first = r;',
      'last = r;',
      '// 3) Безопасное удаление головы:',
      'Node* tmp = first; first = first->next; delete tmp;',
    ],
    steps: [
      {
        title: 'Шаг 1. Стек (LIFO): добавление нового узла ПЕРЕД вершиной top',
        activeLine: 4,
        commentary:
          'В стеке новый узел q выделяется в Куче (new Node), его поле q->next цепляется за старую вершину top, после чего сам указатель top переставляется на q. Кто пришёл последним — стоит первым!',
        blocks: [
          {
            label: 'Стек указателей (STACK)',
            segment: 'STACK',
            cells: [{key: 'Node* top', value: '0x5020 (указывает на новый узел 20)', active: true}],
          },
          {
            label: 'Динамическая память (HEAP — Стек LIFO)',
            segment: 'HEAP',
            highlight: 'mutated',
            cells: [
              {
                key: 'Узел 0x5020 (новый)',
                value: '{ inf: 20 | next: 0x5010 }',
                active: true,
                badge: 'вершина top',
              },
              {key: 'Узел 0x5010 (старый)', value: '{ inf: 10 | next: nullptr }'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 2. Очередь (FIFO): добавление нового узла В ХВОСТ за указателем last',
        activeLine: 8,
        commentary:
          'В очереди два указателя: first (голова) и last (хвост). Новый узел r привязывается ПОСЛЕ хвоста: last->next = r, а затем указатель last сдвигается на r (last = r).',
        blocks: [
          {
            label: 'Указатели очереди на Стеке',
            segment: 'STACK',
            cells: [
              {key: 'Node* first', value: '0x6010 (голова очереди — узел 10)'},
              {key: 'Node* last', value: '0x6020 (хвост очереди — узел 20)', active: true},
            ],
          },
          {
            label: 'Динамическая память (HEAP — Очередь FIFO)',
            segment: 'HEAP',
            highlight: 'mutated',
            cells: [
              {key: 'Узел 0x6010 (first)', value: '{ inf: 10 | next: 0x6020 }'},
              {
                key: 'Узел 0x6020 (last)',
                value: '{ inf: 20 | next: nullptr }',
                active: true,
                badge: 'новый хвост',
              },
            ],
          },
        ],
      },
      {
        title: 'Шаг 3. Освобождение памяти узла без ошибки Use-After-Free',
        activeLine: 10,
        commentary:
          'Чтобы удалить головной узел, мы СНАЧАЛА запоминаем его адрес в tmp = first и сдвигаем first = first->next на второй узел, и ТОЛЬКО ПОТОМ вызываем delete tmp;!',
        blocks: [
          {
            label: 'Указатели после сдвига first',
            segment: 'STACK',
            cells: [
              {key: 'Node* tmp', value: '0x6010 (освобождён через delete)', badge: 'deleted'},
              {key: 'Node* first', value: '0x6020 (теперь голова — узел 20)', active: true},
            ],
          },
          {
            label: 'Куча (HEAP) после delete tmp',
            segment: 'HEAP',
            highlight: 'deleted',
            cells: [
              {key: '0x6010', value: '[ Память возвращена ОС ]', badge: 'освобождено'},
              {key: '0x6020 (first, last)', value: '{ inf: 20 | next: nullptr }', active: true},
            ],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // SCENARIO 4: Рекурсия (стек вызовов gcd) и обходы дерева LNR vs LRN
  // ==========================================================================
  {
    id: 'recursion-and-bst',
    shortTitle: '4. Рекурсия gcd(48, 18) и обходы дерева LNR/LRN',
    fullTitle: 'Стек фреймов активации при рекурсии и почему дерево удаляют только обходом LRN',
    badge: 'Рекурсия · Call Stack · BST',
    codeLines: [
      'int gcd(int a, int b) {',
      '  if (b == 0) return a; // Базовый случай рекурсии',
      '  return gcd(b, a % b); // Рекурсивный спуск',
      '}',
      '// Симметричный обход BST (вывод по возрастанию):',
      'void Print_LNR(Tree* t) { if(!t) return; Print_LNR(t->L); cout<<t->inf; Print_LNR(t->R); }',
      '// Концевой обход (безопасное удаление дерева):',
      'void Del_LRN(Tree* t) { if(!t) return; Del_LRN(t->L); Del_LRN(t->R); delete t; }',
    ],
    steps: [
      {
        title: 'Шаг 1. Погружение рекурсии gcd(48, 18) → рост стека фреймов активации',
        activeLine: 3,
        commentary:
          'При каждом рекурсивном вызове в стеке создаётся НОВЫЙ фрейм активации со своими локальными копиями параметров a и b: gcd(48,18) → gcd(18,12) → gcd(12,6) → gcd(6,0).',
        blocks: [
          {
            label: 'Стек вызовов (Call Stack — сверху вниз по мере вложенности)',
            segment: 'STACK',
            highlight: 'active',
            cells: [
              {key: 'Фрейм #1', value: 'gcd(a = 48, b = 18) -> ждёт gcd(18, 12)'},
              {key: 'Фрейм #2', value: 'gcd(a = 18, b = 12) -> ждёт gcd(12, 6)'},
              {key: 'Фрейм #3', value: 'gcd(a = 12, b = 6)  -> ждёт gcd(6, 0)'},
              {
                key: 'Фрейм #4 (вершина)',
                value: 'gcd(a = 6,  b = 0)  -> БАЗА b == 0!',
                active: true,
                badge: 'return 6',
              },
            ],
          },
        ],
      },
      {
        title: 'Шаг 2. Свёртка стека (раскрутка рекурсии) и обход дерева LNR',
        activeLine: 6,
        commentary:
          'Фрейм #4 возвращает 6 и уничтожается, за ним по цепочке сворачиваются фреймы #3, #2, #1. Аналогично симметричный обход LNR для дерева с корнем 10, левым узлом 5 и правым 15 печатает: 5 → 10 → 15 (строго по возрастанию!).',
        consoleOutput: 'gcd(48, 18) = 6 | Обход LNR дерева {10, L:5, R:15}: 5 10 15',
        blocks: [
          {
            label: 'Бинарное дерево поиска (BST) в Куче',
            segment: 'HEAP',
            cells: [
              {key: 'Левый потомок (L)', value: 'Узел 5 (печатается 1-м при LNR)', active: true},
              {key: 'Корень (N)', value: 'Узел 10 (печатается 2-м при LNR)', active: true},
              {key: 'Правый потомок (R)', value: 'Узел 15 (печатается 3-м при LNR)', active: true},
            ],
          },
        ],
      },
      {
        title: 'Шаг 3. Почему удаление дерева Del_Tree обязано быть обратным обходом LRN',
        activeLine: 8,
        commentary:
          'При удалении дерева (Del_LRN) мы СНАЧАЛА рекурсивно удаляем левое поддерево (5) и правое поддерево (15), и ТОЛЬКО В КОНЦЕ вызываем delete t для корня (10).',
        blocks: [
          {
            label: 'Порядок освобождения памяти узлов при LRN',
            segment: 'HEAP',
            highlight: 'deleted',
            cells: [
              {key: '1-м удаляется Left', value: 'delete узел(5)', badge: 'шаг L'},
              {key: '2-м удаляется Right', value: 'delete узел(15)', badge: 'шаг R'},
              {key: '3-м удаляется Node', value: 'delete корень(10)', active: true, badge: 'шаг N'},
            ],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // SCENARIO 5: Адресная арифметика p + k и одномерная развёртка матрицы
  // ==========================================================================
  {
    id: 'pointer-arithmetic-flat',
    shortTitle: '5. Адресная арифметика и развёртка A[i*q + j]',
    fullTitle: 'Как работает p + k в байтах (k * sizeof(T)) и хранение матрицы по строкам в одномерном массиве',
    badge: 'Указатели · sizeof(T) · Индексация',
    codeLines: [
      'int arr[4] = {10, 20, 30, 40}; // sizeof(int) == 4 байта',
      'int* p = arr; // базовый адрес 0x1000',
      'int val = *(p + 2); // адрес = 0x1000 + 2 * sizeof(int) = 0x1008',
      '// Одномерная развёртка матрицы m строк × q столбцов:',
      'int q = 3; // число столбцов в строке',
      'int* flat = new int[2 * 3];',
      'flat[i * q + j] = x; // элемент строки i, столбца j',
    ],
    steps: [
      {
        title: 'Шаг 1. Сдвиг указателя p + k масштабируется на sizeof(T) байт!',
        activeLine: 3,
        commentary:
          'Прибавление числа k к указателю int* p смещает адрес НЕ на k байт, а на k * sizeof(int) = 2 * 4 = 8 байт (от 0x1000 сразу к 0x1008, где лежит arr[2] = 30).',
        blocks: [
          {
            label: 'Непрерывный массив int arr[4] в памяти (шаг адресов +4 байта)',
            segment: 'STACK',
            highlight: 'active',
            cells: [
              {key: '0x1000 (p + 0)', value: 'arr[0] = 10'},
              {key: '0x1004 (p + 1)', value: 'arr[1] = 20'},
              {
                key: '0x1008 (p + 2)',
                value: 'arr[2] = 30',
                active: true,
                badge: '*(p + 2) == 30',
              },
              {key: '0x100C (p + 3)', value: 'arr[3] = 40'},
            ],
          },
        ],
      },
      {
        title: 'Шаг 2. Одномерная развёртка матрицы: формула индекса i * q + j',
        activeLine: 7,
        commentary:
          'Чтобы попасть в строку i и столбец j матрицы с q столбцами, нужно пропустить i полных строк по q элементов (i * q) и сместиться на j элементов внутри текущей строки!',
        blocks: [
          {
            label: 'Матрица 2×3 (q = 3 столбца), развёрнутая в линейный массив flat[6]',
            segment: 'HEAP',
            highlight: 'mutated',
            cells: [
              {key: 'Строка i=0 (индексы 0..2)', value: 'flat[0*3+0]  flat[0*3+1]  flat[0*3+2]'},
              {
                key: 'Элемент (i=1, j=2)',
                value: 'индекс = 1 * 3 + 2 = 5 -> flat[5]',
                active: true,
                badge: 'i * q + j',
              },
            ],
          },
        ],
      },
    ],
  },
];

export function CppMemoryTracerModal({isOpen, onClose}: CppMemoryTracerModalProps) {
  const [scenarioId, setScenarioId] = useState<string>(CPP_SCENARIOS[0].id);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeScenario =
    CPP_SCENARIOS.find((s) => s.id === scenarioId) || CPP_SCENARIOS[0];
  const currentStep = activeScenario.steps[stepIdx] || activeScenario.steps[0];

  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev + 1 < activeScenario.steps.length) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    }, 2800);
    return () => window.clearInterval(timer);
  }, [isOpen, isPlaying, activeScenario]);

  if (!isOpen) return null;

  const handleSelectScenario = (id: string) => {
    setScenarioId(id);
    setStepIdx(0);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#0B101B] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Визуализатор памяти C/C++ и алгоритмов АИП
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Stack · Heap · Указатели · 5 сценариев
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Пошаговая трассировка экзаменационных задач АИП с визуализацией стека, кучи и указателей
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Selector Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-white/10 flex flex-wrap gap-1.5">
          {CPP_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sc.id === activeScenario.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {sc.shortTitle}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Scenario Banner + Playback Controls */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {activeScenario.badge}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {activeScenario.fullTitle}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setStepIdx(0);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                title="В начало"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setStepIdx((p) => Math.max(0, p - 1));
                }}
                disabled={stepIdx === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-slate-200"
              >
                <SkipBack className="w-3.5 h-3.5" />
                Шаг назад
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Пауза' : 'Авто'}</span>
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setStepIdx((p) => Math.min(activeScenario.steps.length - 1, p + 1));
                }}
                disabled={stepIdx === activeScenario.steps.length - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 disabled:opacity-40 text-xs font-semibold text-amber-200"
              >
                Шаг вперёд
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Code & Memory Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Highlighted C++ Code */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-white/10 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-200">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  exam_trace.cpp
                </span>
                <span>
                  Шаг {stepIdx + 1} из {activeScenario.steps.length}
                </span>
              </div>

              <div className="font-mono text-xs space-y-1 overflow-x-auto py-1">
                {activeScenario.codeLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isActive = currentStep.activeLine === lineNum;
                  return (
                    <div
                      key={lineNum}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center gap-3 transition-all ${
                        isActive
                          ? 'bg-amber-500/20 border-l-4 border-amber-400 text-amber-100 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className="w-4 text-right text-[10px] text-slate-600 select-none">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre">{line}</span>
                    </div>
                  );
                })}
              </div>

              {currentStep.consoleOutput && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 font-mono text-xs text-emerald-300">
                  <span className="text-emerald-400 font-bold">STDOUT &gt; </span>
                  {currentStep.consoleOutput}
                </div>
              )}
            </div>

            {/* Right: Visual Stack & Heap Memory Inspector */}
            <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
              {/* Step Commentary */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  <span>{currentStep.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentStep.commentary}
                </p>
              </div>

              {/* Memory Blocks */}
              <div className="space-y-3">
                {currentStep.blocks.map((blk, bIdx) => (
                  <div
                    key={bIdx}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      blk.segment === 'HEAP'
                        ? 'bg-indigo-950/25 border-indigo-500/35'
                        : 'bg-slate-950/90 border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        {blk.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          blk.segment === 'HEAP'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {blk.segment === 'HEAP' ? 'КУЧА (HEAP)' : 'СТЕК (STACK)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {blk.cells.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          className={`px-3 py-2 rounded-lg border font-mono text-xs flex flex-wrap items-center justify-between gap-2 ${
                            cell.active
                              ? 'bg-amber-500/15 border-amber-400/60 text-amber-100'
                              : 'bg-slate-900/90 border-white/10 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-300 font-bold">{cell.key}:</span>
                            <span>{cell.value}</span>
                          </div>
                          {cell.badge && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              {cell.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
