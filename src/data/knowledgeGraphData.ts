import {CardSRState, StudyCategory, TheoryCard} from '../types/study';
import {getCardSRState} from '../utils/spacedRepetition';

export interface SkillNodeDef {
  id: string;
  label: string;
  shortLabel: string;
  tier: number; // 0 = Foundation, 1 = Core, 2 = Advanced, 3 = Boss/Exam
  col: number; // Horizontal slot within tier (0..1 normalized or index)
  description: string;
  cardIds: number[];
  /** Prerequisite node IDs that this node depends on ("опирается на") */
  prereqs: string[];
}

export interface ComputedSkillNode extends SkillNodeDef {
  x: number; // SVG coordinate 0..1000
  y: number; // SVG coordinate 0..640
  totalCards: number;
  knownCards: number;
  hardCards: number;
  masteryPct: number;
  status: 'mastered' | 'shaky' | 'critical';
}

export interface DominoImpactReport {
  sourceNodeId: string;
  /** All downstream node IDs that rely (directly or transitively) on sourceNodeId */
  affectedNodeIds: string[];
  /** Edges on the cascade path (from -> to) */
  affectedEdgeKeys: string[];
  /** Total unique exam cards across source + affected nodes */
  affectedCardsCount: number;
  /** Shortest topologically sorted repair sequence starting from unmastered root prerequisites */
  repairPathNodeIds: string[];
}

const MATAN_SKILL_TREE: SkillNodeDef[] = [
  // Tier 0: Фундамент
  {
    id: 'm_defs',
    label: 'Базовые определения (1–48)',
    shortLabel: 'База и кванторы',
    tier: 0,
    col: 0,
    description: 'Точные определения окрестности, ограниченности, супремума, предела, непрерывности и производной.',
    cardIds: Array.from({length: 24}, (_, i) => 551 + i),
    prereqs: [],
  },
  {
    id: 'm_seq',
    label: 'Предел последовательности',
    shortLabel: 'Предел посл.',
    tier: 0,
    col: 1,
    description: 'Единственность, ограниченность, сжатая переменная, ε–N доказательства, дроби многочленов и число e.',
    cardIds: [501, 502, 503, 504, 505, 506, 601, 602],
    prereqs: [],
  },
  {
    id: 'm_bmf',
    label: 'Б.м.ф., б.б.ф., o-малое и эквивалентность',
    shortLabel: 'Б.м.ф. и o(x)',
    tier: 0,
    col: 2,
    description: 'Свойства б.м.ф. и б.б.ф., сравнение порядков, таблица 10 эквивалентностей, запрет в разности и главные части.',
    cardIds: [511, 512, 513, 514, 515, 607, 609, 610, 611, 612, 613, 614],
    prereqs: ['m_seq'],
  },
  // Tier 1: Пределы и непрерывность
  {
    id: 'm_lim_fn',
    label: 'Предел функции и 1-й/2-й замечательные',
    shortLabel: 'Предел функции',
    tier: 1,
    col: 0,
    description: '6 окрестностей Коши и Гейне, сопряжённые/замена корней, ловушка |x|=−x, замечательные пределы и 1^∞.',
    cardIds: [507, 508, 509, 510, 603, 604, 605, 606, 608],
    prereqs: ['m_defs', 'm_seq', 'm_bmf'],
  },
  {
    id: 'm_cont',
    label: 'Непрерывность и разрывы',
    shortLabel: 'Непрерывность',
    tier: 1,
    col: 1,
    description: '4 определения непрерывности, перестановка lim g(f(x)), классификация разрывов 1-го и 2-го рода и скачок.',
    cardIds: [516, 517, 518, 519, 615, 616, 617],
    prereqs: ['m_lim_fn'],
  },
  {
    id: 'm_compact',
    label: 'Больцано — Коши и Вейерштрасс',
    shortLabel: 'Больцано и Вейершт.',
    tier: 1,
    col: 2,
    description: 'Промежуточные значения, метод бисекции, ограниченность и достижимость max/min на отрезке [a, b].',
    cardIds: [520, 521, 522, 618],
    prereqs: ['m_cont', 'm_seq'],
  },
  // Tier 2: Дифференциальное исчисление
  {
    id: 'm_deriv',
    label: 'Производная и дифференциал',
    shortLabel: 'Производная и df',
    tier: 2,
    col: 0,
    description: 'Связь дифференцируемости и непрерывности, инвариантность формы d f, цепное правило и обратная функция.',
    cardIds: [523, 524, 525, 526, 527, 528, 529, ...Array.from({length: 24}, (_, i) => 575 + i)],
    prereqs: ['m_lim_fn', 'm_cont', 'm_bmf'],
  },
  {
    id: 'm_mvt',
    label: 'Теоремы Ферма, Ролля, Лагранжа, Коши',
    shortLabel: 'Ролль / Лагранж / Коши',
    tier: 2,
    col: 1,
    description: 'Фундаментальные теоремы о среднем дифференциального исчисления и их геометрический смысл.',
    cardIds: [530, 531, 532, 533, 534],
    prereqs: ['m_deriv', 'm_compact'],
  },
  {
    id: 'm_lhopital',
    label: 'Правило Лопиталя (0/0, ∞/∞)',
    shortLabel: 'Правило Лопиталя',
    tier: 2,
    col: 2,
    description: 'Раскрытие неопределённостей через теорему Коши и ловушки повторного дифференцирования.',
    cardIds: [535, 536],
    prereqs: ['m_mvt', 'm_lim_fn'],
  },
  // Tier 3: Экзаменационные боссы
  {
    id: 'm_taylor',
    label: 'Формула Тейлора (Пеано и Лагранж)',
    shortLabel: 'Тейлор и Маклорен',
    tier: 3,
    col: 0,
    description: 'Локальная формула с остатком в форме Пеано, остаток Лагранжа и 6 базовых разложений Маклорена.',
    cardIds: [537, 538, 539, 540, 541, 542],
    prereqs: ['m_deriv', 'm_bmf', 'm_lhopital'],
  },
  {
    id: 'm_extremum',
    label: 'Монотонность и экстремумы',
    shortLabel: 'Экстремумы',
    tier: 3,
    col: 1,
    description: 'Признаки монотонности, 1-е и 2-е достаточные условия экстремума, высшие производные.',
    cardIds: [543, 544, 545, 546],
    prereqs: ['m_mvt', 'm_taylor'],
  },
  {
    id: 'm_convex',
    label: 'Выпуклость, перегибы и асимптоты',
    shortLabel: 'График и асимптоты',
    tier: 3,
    col: 2,
    description: 'Условия выпуклости через f″, точки перегиба, вертикальные/наклонные асимптоты и полная схема (Комплект 5).',
    cardIds: [547, 548, 549],
    prereqs: ['m_extremum', 'm_lim_fn'],
  },
];

const RK_SKILL_TREE: SkillNodeDef[] = [
  // Tier 0
  {
    id: 'rk_ops',
    label: 'Матрицы и алгебраические операции',
    shortLabel: 'Операции матриц',
    tier: 0,
    col: 0,
    description: 'Равенство, сложение, умножение, транспонирование и некоммутативность матриц.',
    cardIds: [201, 202, 203, 204, 205, 214, 215, 216],
    prereqs: [],
  },
  {
    id: 'rk_elem',
    label: 'Элементарные преобразования',
    shortLabel: 'Элем. преобр.',
    tier: 0,
    col: 1,
    description: 'Перестановка строк, умножение на λ ≠ 0, прибавление линейной комбинации строк.',
    cardIds: [213, 218],
    prereqs: [],
  },
  // Tier 1
  {
    id: 'rk_inv',
    label: 'Обратная матрица и критерий',
    shortLabel: 'Обратная A⁻¹',
    tier: 1,
    col: 0,
    description: 'Определение A⁻¹, свойства (AB)⁻¹ = B⁻¹A⁻¹, присоединённая матрица A* и доказательство критерия.',
    cardIds: [206, 217, 224, 228],
    prereqs: ['rk_ops'],
  },
  {
    id: 'rk_rank',
    label: 'Миноры, ранг и базисный минор',
    shortLabel: 'Ранг и баз. минор',
    tier: 1,
    col: 1,
    description: 'Определение ранга, метод окаймляющих миноров и фундаментальная теорема о базисном миноре.',
    cardIds: [207, 208, 219, 227],
    prereqs: ['rk_ops', 'rk_elem'],
  },
  // Tier 2
  {
    id: 'rk_slau_base',
    label: 'СЛАУ и теорема Кронекера — Капелли',
    shortLabel: 'Кронекер-Капелли',
    tier: 2,
    col: 0,
    description: 'Совместность СЛАУ, критерий rg(A) = rg(Ã) и метод Гаусса.',
    cardIds: [209, 210, 211, 220, 225, 226],
    prereqs: ['rk_rank', 'rk_elem'],
  },
  {
    id: 'rk_fsr',
    label: 'Однородные СЛАУ и ФСР',
    shortLabel: 'ОСЛАУ и ФСР',
    tier: 2,
    col: 1,
    description: 'Пространство решений AX = 0, размерность n − r, построение фундаментальной системы решений.',
    cardIds: [212, 221, 222, 229, 230],
    prereqs: ['rk_rank', 'rk_slau_base'],
  },
  // Tier 3
  {
    id: 'rk_general',
    label: 'Общее решение НСЛАУ и билет РК 2',
    shortLabel: 'Общее реш. НСЛАУ',
    tier: 3,
    col: 0,
    description: 'Структура общего решения X = X_частн + X_однор, метод Крамера и полная сборка билета РК 2.',
    cardIds: [223, 231, 232],
    prereqs: ['rk_inv', 'rk_slau_base', 'rk_fsr'],
  },
];

const AIP_SKILL_TREE: SkillNodeDef[] = [
  // Tier 0
  {
    id: 'aip_ch1',
    label: 'Глава 1 · Типы данных и ввод-вывод',
    shortLabel: 'Типы и I/O',
    tier: 0,
    col: 0,
    description: 'Алфавит C++, базовые типы, приведение типов, cin/cout, арифметика.',
    cardIds: [1, 2, 3, 4, 5, 6, 7],
    prereqs: [],
  },
  {
    id: 'aip_ch2',
    label: 'Глава 2 · Ветвления и циклы',
    shortLabel: 'Ветвления/Циклы',
    tier: 0,
    col: 1,
    description: 'if/else, switch, while/do-while/for, break/continue и схемы ГОСТ.',
    cardIds: [8, 9, 10, 11, 12, 13, 14, 15],
    prereqs: ['aip_ch1'],
  },
  // Tier 1
  {
    id: 'aip_ch3_arr',
    label: 'Массивы, строки и структуры',
    shortLabel: 'Массивы и struct',
    tier: 1,
    col: 0,
    description: 'Индексация, C-строки и std::string, структуры и составные данные.',
    cardIds: [16, 17, 18, 21, 22],
    prereqs: ['aip_ch2'],
  },
  {
    id: 'aip_ch3_ptr',
    label: 'Указатели, ссылки и память (new/delete)',
    shortLabel: 'Указатели и Heap',
    tier: 1,
    col: 1,
    description: 'Адресация, разыменование, динамическая память, утечки и nullptr.',
    cardIds: [19, 20, 51, 52, 53],
    prereqs: ['aip_ch1', 'aip_ch3_arr'],
  },
  // Tier 2
  {
    id: 'aip_ch4',
    label: 'Глава 4 · Функции и рекурсия',
    shortLabel: 'Функции/Рекурсия',
    tier: 2,
    col: 0,
    description: 'Передача по значению/ссылке/указателю, стек вызовов и рекурсивные алгоритмы.',
    cardIds: [23, 24, 25, 26, 27, 28, 29, 30, 54, 55],
    prereqs: ['aip_ch2', 'aip_ch3_ptr'],
  },
  {
    id: 'aip_ch5',
    label: 'Глава 5 · Списки, стеки и очереди',
    shortLabel: 'Списки/Стек/Очередь',
    tier: 2,
    col: 1,
    description: 'Односвязные/двусвязные списки, LIFO стек, FIFO очередь, вставка и удаление узлов.',
    cardIds: [31, 32, 33, 34, 35, 36, 37, 38, 56, 57],
    prereqs: ['aip_ch3_ptr', 'aip_ch3_arr'],
  },
  {
    id: 'aip_ch6',
    label: 'Глава 6 · Файлы и кодировки',
    shortLabel: 'Файлы и UTF-8',
    tier: 2,
    col: 2,
    description: 'Текстовые и бинарные потоки fstream, буферизация, ASCII/UTF-8.',
    cardIds: [39, 40, 41, 42, 43, 44, 58, 59],
    prereqs: ['aip_ch3_arr', 'aip_ch4'],
  },
  // Tier 3
  {
    id: 'aip_ch8',
    label: 'Глава 8 · Деревья, обходы и РБНФ',
    shortLabel: 'Деревья и РБНФ',
    tier: 3,
    col: 0,
    description: 'Бинарные деревья поиска, рекурсивные обходы (LNR/NLR/LRN), синтаксический разбор выражений.',
    cardIds: [45, 46, 47, 48, 49, 50, 60, 61, 62],
    prereqs: ['aip_ch4', 'aip_ch5'],
  },
];

function buildCustomPdfSkillTree(cards: TheoryCard[]): SkillNodeDef[] {
  const byChapter = new Map<string, number[]>();
  for (const c of cards) {
    const ch = String(c.chapter || 'Основной раздел').trim();
    const list = byChapter.get(ch) ?? [];
    list.push(c.id);
    byChapter.set(ch, list);
  }
  const chapters = Array.from(byChapter.entries());
  if (chapters.length === 0) return [];

  return chapters.map(([ch, ids], idx) => {
    const tier = Math.min(3, Math.floor((idx * 4) / Math.max(1, chapters.length)));
    const prereqs = idx > 0 ? [`pdf_ch_${idx - 1}`] : [];
    return {
      id: `pdf_ch_${idx}`,
      label: ch,
      shortLabel: ch.length > 22 ? `${ch.slice(0, 21)}…` : ch,
      tier,
      col: idx % 2,
      description: `Раздел из PDF-конспекта (${ids.length} карточек).`,
      cardIds: ids,
      prereqs,
    };
  });
}

export function buildComputedSkillGraph(
  category: StudyCategory,
  allCards: TheoryCard[],
  srMap: Record<number, CardSRState>,
): ComputedSkillNode[] {
  const validCardIds = new Set(allCards.map((c) => c.id));
  const rawNodes =
    category === 'matan'
      ? MATAN_SKILL_TREE
      : category === 'rk'
        ? RK_SKILL_TREE
        : category === 'exam'
          ? AIP_SKILL_TREE
          : buildCustomPdfSkillTree(allCards);

  // Group by tier to lay out coordinates cleanly in 1000 x 620 SVG viewport
  const tiers = new Map<number, SkillNodeDef[]>();
  for (const node of rawNodes) {
    const list = tiers.get(node.tier) ?? [];
    list.push(node);
    tiers.set(node.tier, list);
  }

  const sortedTiers = Array.from(tiers.keys()).sort((a, b) => a - b);
  const tierCount = Math.max(1, sortedTiers.length);

  const computed: ComputedSkillNode[] = [];

  sortedTiers.forEach((tierKey, tierIdx) => {
    const nodesInTier = tiers.get(tierKey) ?? [];
    // Bottom-to-top or top-to-bottom? Top-to-bottom: Foundation at top (y=85), Bosses at bottom (y=545)
    const y =
      tierCount === 1
        ? 310
        : 85 + (tierIdx / (tierCount - 1)) * 455;

    nodesInTier.forEach((node, idx) => {
      const n = nodesInTier.length;
      const x =
        n === 1
          ? 500
          : 175 + (idx / (n - 1)) * 650;

      const linkedIds = node.cardIds.filter((id) => validCardIds.has(id));
      let knownCards = 0;
      let hardCards = 0;
      let scoreSum = 0;
      for (const id of linkedIds) {
        const sr = getCardSRState(srMap, id);
        if (sr.status === 'known') {
          knownCards++;
          scoreSum += 1;
        } else if (sr.status === 'learning') {
          scoreSum += 0.55;
        } else if (sr.status === 'hard') {
          hardCards++;
          scoreSum += 0.15;
        }
      }
      const totalCards = linkedIds.length;
      const masteryPct =
        totalCards > 0 ? Math.round((scoreSum / totalCards) * 100) : 0;
      const status: ComputedSkillNode['status'] =
        masteryPct >= 75 ? 'mastered' : masteryPct >= 35 ? 'shaky' : 'critical';

      computed.push({
        ...node,
        cardIds: linkedIds,
        x,
        y,
        totalCards,
        knownCards,
        hardCards,
        masteryPct,
        status,
      });
    });
  });

  return computed;
}

/**
 * Computes the Domino Cascade impact of a weak/selected node:
 * 1) Forward BFS: every downstream node that depends on sourceNodeId
 * 2) Backward BFS: shortest topologically sorted repair path from unmastered root prerequisites
 */
export function computeDominoImpact(
  nodes: ComputedSkillNode[],
  sourceNodeId: string,
): DominoImpactReport {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, string[]>();
  for (const n of nodes) {
    for (const p of n.prereqs) {
      const list = childrenMap.get(p) ?? [];
      list.push(n.id);
      childrenMap.set(p, list);
    }
  }

  // Forward BFS: domino collapse upward/downward to dependent exam topics
  const affectedSet = new Set<string>();
  const affectedEdgeKeys = new Set<string>();
  const queue: string[] = [sourceNodeId];
  const visited = new Set<string>([sourceNodeId]);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const children = childrenMap.get(curr) ?? [];
    for (const childId of children) {
      affectedEdgeKeys.add(`${curr}->${childId}`);
      affectedSet.add(childId);
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    }
  }

  // Unique cards at risk (source + all affected downstream nodes)
  const cardIdSet = new Set<number>();
  const src = byId.get(sourceNodeId);
  if (src) src.cardIds.forEach((id) => cardIdSet.add(id));
  affectedSet.forEach((nid) => {
    byId.get(nid)?.cardIds.forEach((id) => cardIdSet.add(id));
  });

  // Backward DFS: collect unmastered prerequisites + sourceNodeId, ordered by tier (foundations first!)
  const needed = new Set<string>();
  const collectPrereqs = (nid: string) => {
    const node = byId.get(nid);
    if (!node) return;
    if (node.status !== 'mastered' || nid === sourceNodeId) {
      needed.add(nid);
      for (const p of node.prereqs) {
        if (!needed.has(p)) collectPrereqs(p);
      }
    }
  };
  collectPrereqs(sourceNodeId);

  const repairPathNodeIds = Array.from(needed).sort((a, b) => {
    const na = byId.get(a);
    const nb = byId.get(b);
    return (na?.tier ?? 0) - (nb?.tier ?? 0);
  });

  return {
    sourceNodeId,
    affectedNodeIds: Array.from(affectedSet),
    affectedEdgeKeys: Array.from(affectedEdgeKeys),
    affectedCardsCount: cardIdSet.size,
    repairPathNodeIds,
  };
}

/** Finds the single highest-impact weak foundation node causing the biggest domino collapse */
export function findHighestDominoRiskNode(
  nodes: ComputedSkillNode[],
): ComputedSkillNode | null {
  const weak = nodes.filter((n) => n.status !== 'mastered');
  if (weak.length === 0) return nodes[0] ?? null;

  let best: ComputedSkillNode = weak[0];
  let bestScore = -1;
  for (const n of weak) {
    const impact = computeDominoImpact(nodes, n.id);
    const score =
      impact.affectedNodeIds.length * 100 +
      impact.affectedCardsCount * 2 +
      (100 - n.masteryPct);
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best;
}

export interface PrerequisiteTopicsResult {
  directPrereqIds: string[];
  allAncestorIds: string[];
  directEdgeKeys: string[];
  allAncestorEdgeKeys: string[];
}

/**
 * Collects direct prerequisite nodes and all transitive ancestor topics
 * feeding into targetNodeId (sorted from foundation tier 0 upward).
 */
export function collectPrerequisiteTopics(
  nodes: ComputedSkillNode[],
  targetNodeId: string,
): PrerequisiteTopicsResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = byId.get(targetNodeId);
  if (!target) {
    return {
      directPrereqIds: [],
      allAncestorIds: [],
      directEdgeKeys: [],
      allAncestorEdgeKeys: [],
    };
  }

  const directPrereqIds = target.prereqs.filter((id) => byId.has(id));
  const directEdgeKeys = directPrereqIds.map((p) => `${p}->${targetNodeId}`);

  const ancestorSet = new Set<string>();
  const allAncestorEdgeKeys = new Set<string>();
  const queue: string[] = [targetNodeId];
  const visited = new Set<string>([targetNodeId]);

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const curr = byId.get(currId);
    if (!curr) continue;
    for (const p of curr.prereqs) {
      if (!byId.has(p)) continue;
      allAncestorEdgeKeys.add(`${p}->${currId}`);
      ancestorSet.add(p);
      if (!visited.has(p)) {
        visited.add(p);
        queue.push(p);
      }
    }
  }

  const allAncestorIds = Array.from(ancestorSet).sort((a, b) => {
    const na = byId.get(a);
    const nb = byId.get(b);
    if ((na?.tier ?? 0) !== (nb?.tier ?? 0)) {
      return (na?.tier ?? 0) - (nb?.tier ?? 0);
    }
    return (na?.col ?? 0) - (nb?.col ?? 0);
  });

  return {
    directPrereqIds,
    allAncestorIds,
    directEdgeKeys,
    allAncestorEdgeKeys: Array.from(allAncestorEdgeKeys),
  };
}

