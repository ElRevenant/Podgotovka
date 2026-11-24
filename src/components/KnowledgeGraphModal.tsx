import {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  History,
  Layers,
  Route,
  Sparkles,
  X,
} from 'lucide-react';
import {
  buildComputedSkillGraph,
  collectPrerequisiteTopics,
  ComputedSkillNode,
  computeDominoImpact,
  findHighestDominoRiskNode,
} from '../data/knowledgeGraphData';
import {CardSRState, StudyCategory, TheoryCard} from '../types/study';
import {
  getCardMasteryPercent,
  getCardSRState,
  getCardVisualTier,
} from '../utils/spacedRepetition';

export type PreviousTopicsMode = 'current' | 'direct' | 'all_ancestors';

interface KnowledgeGraphModalProps {
  category: StudyCategory;
  subjectTitle: string;
  allCards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  onJumpToCard: (cardId: number) => void;
  onOpenTopicInDeck: (
    label: string,
    cardIds: number[],
    startCardId?: number,
  ) => void;
  onClose: () => void;
}

const TIER_LABELS = [
  'Уровень 1 · Фундамент',
  'Уровень 2 · Опорные теоремы',
  'Уровень 3 · Основной аппарат',
  'Уровень 4 · Билеты-боссы',
];

export function KnowledgeGraphModal({
  category,
  subjectTitle,
  allCards,
  srMap,
  onJumpToCard,
  onOpenTopicInDeck,
  onClose,
}: KnowledgeGraphModalProps) {
  const nodes = useMemo(
    () => buildComputedSkillGraph(category, allCards, srMap),
    [category, allCards, srMap],
  );

  const highestRiskNode = useMemo(() => findHighestDominoRiskNode(nodes), [nodes]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    () => highestRiskNode?.id ?? nodes[0]?.id ?? '',
  );
  const [dominoMode, setDominoMode] = useState<boolean>(true);
  const [prevMode, setPrevMode] = useState<PreviousTopicsMode>('current');
  const [onlyUnlearned, setOnlyUnlearned] = useState<boolean>(false);
  const [autoJumpOnClick, setAutoJumpOnClick] = useState<boolean>(false);

  useEffect(() => {
    if (!nodes.some((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(highestRiskNode?.id ?? nodes[0]?.id ?? '');
    }
  }, [nodes, selectedNodeId, highestRiskNode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const cardsById = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards],
  );
  const selectedNode: ComputedSkillNode | null = byId.get(selectedNodeId) ?? null;

  const dominoReport = useMemo(() => {
    if (!selectedNodeId) return null;
    return computeDominoImpact(nodes, selectedNodeId);
  }, [nodes, selectedNodeId]);

  const prereqInfo = useMemo(() => {
    if (!selectedNodeId) {
      return {
        directPrereqIds: [],
        allAncestorIds: [],
        directEdgeKeys: [],
        allAncestorEdgeKeys: [],
      };
    }
    return collectPrerequisiteTopics(nodes, selectedNodeId);
  }, [nodes, selectedNodeId]);

  const includedPrereqIds = useMemo(() => {
    if (prevMode === 'direct') return prereqInfo.directPrereqIds;
    if (prevMode === 'all_ancestors') return prereqInfo.allAncestorIds;
    return [];
  }, [prevMode, prereqInfo]);

  const includedPrereqSet = useMemo(
    () => new Set(includedPrereqIds),
    [includedPrereqIds],
  );
  const includedPrereqEdgeSet = useMemo(() => {
    if (prevMode === 'direct') return new Set(prereqInfo.directEdgeKeys);
    if (prevMode === 'all_ancestors') return new Set(prereqInfo.allAncestorEdgeKeys);
    return new Set<string>();
  }, [prevMode, prereqInfo]);

  const affectedNodeSet = useMemo(
    () => new Set(dominoReport?.affectedNodeIds ?? []),
    [dominoReport],
  );
  const affectedEdgeSet = useMemo(
    () => new Set(dominoReport?.affectedEdgeKeys ?? []),
    [dominoReport],
  );
  const repairPathSet = useMemo(
    () => new Set(dominoReport?.repairPathNodeIds ?? []),
    [dominoReport],
  );

  const edges = useMemo(() => {
    const list: {from: ComputedSkillNode; to: ComputedSkillNode; key: string}[] = [];
    for (const node of nodes) {
      for (const prereqId of node.prereqs) {
        const from = byId.get(prereqId);
        if (from) {
          list.push({from, to: node, key: `${from.id}->${node.id}`});
        }
      }
    }
    return list;
  }, [nodes, byId]);

  // Build grouped cards: selected topic FIRST (for instant visibility!), then previous topics if toggled
  const cardGroups = useMemo(() => {
    if (!selectedNode) return [];
    const seenCardIds = new Set<number>();

    const buildGroup = (
      node: ComputedSkillNode,
      isPrevious: boolean,
    ): {node: ComputedSkillNode; isPrevious: boolean; cards: TheoryCard[]} | null => {
      const list: TheoryCard[] = [];
      for (const id of node.cardIds) {
        if (seenCardIds.has(id)) continue;
        const card = cardsById.get(id);
        if (!card) continue;
        if (onlyUnlearned) {
          const sr = getCardSRState(srMap, id);
          if (sr.status === 'known') continue;
        }
        seenCardIds.add(id);
        list.push(card);
      }
      if (list.length === 0) return null;
      return {node, isPrevious, cards: list};
    };

    const groups: {node: ComputedSkillNode; isPrevious: boolean; cards: TheoryCard[]}[] = [];

    // Current selected topic first so its cards appear right away
    const mainGroup = buildGroup(selectedNode, false);
    if (mainGroup) groups.push(mainGroup);

    // Then previous prerequisite topics (most direct first or foundation->direct)
    for (const pid of includedPrereqIds) {
      const pNode = byId.get(pid);
      if (!pNode) continue;
      const g = buildGroup(pNode, true);
      if (g) groups.push(g);
    }

    return groups;
  }, [selectedNode, includedPrereqIds, byId, cardsById, onlyUnlearned, srMap]);

  const combinedCardIds = useMemo(
    () => cardGroups.flatMap((g) => g.cards.map((c) => c.id)),
    [cardGroups],
  );

  const selectionLabel = useMemo(() => {
    if (!selectedNode) return '';
    if (prevMode === 'direct' && prereqInfo.directPrereqIds.length > 0) {
      return `${selectedNode.shortLabel} + прямая база`;
    }
    if (prevMode === 'all_ancestors' && prereqInfo.allAncestorIds.length > 0) {
      return `${selectedNode.shortLabel} + все прошлые темы`;
    }
    return selectedNode.shortLabel;
  }, [selectedNode, prevMode, prereqInfo]);

  const buildNodeSelectionForJump = (
    node: ComputedSkillNode,
    mode: PreviousTopicsMode,
  ): {label: string; cardIds: number[]; startCardId?: number} => {
    const pInfo = collectPrerequisiteTopics(nodes, node.id);
    const extraNodeIds =
      mode === 'direct'
        ? pInfo.directPrereqIds
        : mode === 'all_ancestors'
          ? pInfo.allAncestorIds
          : [];

    const idSet = new Set<number>();
    const orderedIds: number[] = [];

    // If studying with previous topics, put previous foundation cards first OR selected topic first?
    // Put selected topic cards + previous topics without duplicates, start on first unlearned card
    const sourceNodes = [
      node,
      ...extraNodeIds
        .map((id) => byId.get(id))
        .filter((n): n is ComputedSkillNode => Boolean(n)),
    ];

    for (const sn of sourceNodes) {
      for (const cid of sn.cardIds) {
        if (idSet.has(cid)) continue;
        if (onlyUnlearned && getCardSRState(srMap, cid).status === 'known') {
          continue;
        }
        idSet.add(cid);
        orderedIds.push(cid);
      }
    }

    // Fallback if onlyUnlearned filtered everything out
    const finalIds = orderedIds.length > 0 ? orderedIds : node.cardIds;
    const firstWeak = finalIds.find(
      (cid) => getCardSRState(srMap, cid).status !== 'known',
    );
    const label =
      mode === 'direct' && pInfo.directPrereqIds.length > 0
        ? `${node.shortLabel} + прямая база`
        : mode === 'all_ancestors' && pInfo.allAncestorIds.length > 0
          ? `${node.shortLabel} + все прошлые темы`
          : node.shortLabel;

    return {
      label,
      cardIds: finalIds,
      startCardId: firstWeak ?? finalIds[0],
    };
  };

  const handleNodeClick = (node: ComputedSkillNode) => {
    setSelectedNodeId(node.id);
    if (autoJumpOnClick) {
      const payload = buildNodeSelectionForJump(node, prevMode);
      if (payload.cardIds.length > 0) {
        onOpenTopicInDeck(payload.label, payload.cardIds, payload.startCardId);
        onClose();
      }
    }
  };

  const handleTransferToDeck = (specificCardId?: number) => {
    if (!selectedNode) return;
    const ids =
      combinedCardIds.length > 0 ? combinedCardIds : selectedNode.cardIds;
    if (ids.length === 0) return;
    const firstWeak = ids.find(
      (cid) => getCardSRState(srMap, cid).status !== 'known',
    );
    onOpenTopicInDeck(
      selectionLabel,
      ids,
      specificCardId ?? firstWeak ?? ids[0],
    );
    onClose();
  };

  const overallStats = useMemo(() => {
    let mastered = 0;
    let shaky = 0;
    let critical = 0;
    for (const n of nodes) {
      if (n.status === 'mastered') mastered++;
      else if (n.status === 'shaky') shaky++;
      else critical++;
    }
    return {mastered, shaky, critical};
  }, [nodes]);

  const isSelectedWeak = selectedNode && selectedNode.status !== 'mastered';
  const hasPrereqs = prereqInfo.allAncestorIds.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Дерево навыков и эффект домино"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-6xl rounded-[20px] prism-surface shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-[#0B101B]/85 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <GitBranch className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-[#F3F4F6] truncate">
                Дерево навыков · {subjectTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                Кликни по теме — сразу увидишь её карточки, прошлые темы-базы и перенос в раздел
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Optional 1-click Auto-Teleport toggle */}
            <button
              type="button"
              onClick={() => setAutoJumpOnClick((v) => !v)}
              title="Если включено, клик по любому узлу сразу переносит тебя в раздел карточек по этой теме"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                autoJumpOnClick
                  ? 'prism-tab-active text-slate-900 dark:text-white'
                  : 'prism-tool-btn text-slate-600 dark:text-[#CBD5E1]'
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>При клике: {autoJumpOnClick ? 'сразу в раздел' : 'превью'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDominoMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                dominoMode
                  ? 'border-rose-500/60 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200'
                  : 'prism-tool-btn text-slate-600 dark:text-[#94A3B8]'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Домино: {dominoMode ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>

            {highestRiskNode && (
              <button
                type="button"
                onClick={() => {
                  setSelectedNodeId(highestRiskNode.id);
                  setDominoMode(true);
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full prism-cta cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-lime-300" />
                <span>Главный пробел</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Split: Left SVG Skill Tree + Right Instant Cards & Inspector */}
        <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_390px] overflow-hidden">
          {/* Interactive SVG DAG Canvas */}
          <div className="relative bg-slate-50 dark:bg-[#070B12] overflow-auto p-3 sm:p-4 flex flex-col">
            {/* Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px] text-slate-600 dark:text-[#9CA3AF]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Освоено ({overallStats.mastered})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Шатко ({overallStats.shaky})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Пробел ({overallStats.critical})
                </span>
                {prevMode !== 'current' && includedPrereqIds.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    Прошлые темы (+{includedPrereqIds.length})
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                Стрелки: «опирается на»
              </span>
            </div>

            <div className="flex-1 min-h-[430px] flex items-center justify-center">
              <svg
                viewBox="0 0 1000 620"
                className="w-full h-full max-h-[600px] select-none"
                role="img"
                aria-label="Интерактивный граф зависимостей тем предмета"
              >
                <defs>
                  <linearGradient id="dt-selected-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d9f99d" />
                    <stop offset="48%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                  <marker
                    id="arrow-neutral"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" opacity="0.55" />
                  </marker>
                  <marker
                    id="arrow-domino"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                  </marker>
                  <marker
                    id="arrow-repair"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#22d3ee" />
                  </marker>
                  <marker
                    id="arrow-prereq"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
                  </marker>
                </defs>

                {/* Subtle Tier Guide Lines */}
                {[85, 236, 388, 540].map((yPos, tIdx) => (
                  <g key={tIdx}>
                    <line
                      x1="28"
                      y1={yPos}
                      x2="972"
                      y2={yPos}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800/70"
                      strokeDasharray="4 6"
                      strokeWidth="1"
                    />
                    <text
                      x="32"
                      y={yPos - 40}
                      className="fill-slate-400 dark:fill-slate-500 text-[10px] font-semibold uppercase"
                    >
                      {TIER_LABELS[tIdx] ?? ''}
                    </text>
                  </g>
                ))}

                {/* Dependency Curved Edges */}
                {edges.map(({from, to, key}) => {
                  const isDominoEdge =
                    dominoMode && isSelectedWeak && affectedEdgeSet.has(key);
                  const isPrereqEdge = includedPrereqEdgeSet.has(key);
                  const isRepairEdge =
                    repairPathSet.has(from.id) && repairPathSet.has(to.id);

                  const startY = from.y + 30;
                  const endY = to.y - 32;
                  const midY = (startY + endY) / 2;
                  const pathD = `M ${from.x} ${startY} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${endY}`;

                  return (
                    <path
                      key={key}
                      d={pathD}
                      fill="none"
                      stroke={
                        isDominoEdge
                          ? '#f43f5e'
                          : isPrereqEdge
                            ? '#8b5cf6'
                            : isRepairEdge
                              ? '#38bdf8'
                              : '#64748b'
                      }
                      strokeWidth={
                        isDominoEdge
                          ? 3.2
                          : isPrereqEdge
                            ? 2.8
                            : isRepairEdge
                              ? 2.4
                              : 1.5
                      }
                      strokeOpacity={
                        isDominoEdge
                          ? 0.95
                          : isPrereqEdge
                            ? 0.9
                            : isRepairEdge
                              ? 0.8
                              : 0.35
                      }
                      strokeDasharray={isDominoEdge ? '8 4' : undefined}
                      markerEnd={
                        isDominoEdge
                          ? 'url(#arrow-domino)'
                          : isPrereqEdge
                            ? 'url(#arrow-prereq)'
                            : isRepairEdge
                              ? 'url(#arrow-repair)'
                              : 'url(#arrow-neutral)'
                      }
                    >
                      {isDominoEdge && (
                        <animate
                          attributeName="stroke-dashoffset"
                          from="24"
                          to="0"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      )}
                    </path>
                  );
                })}

                {/* Skill Nodes */}
                {nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  const isDominoVictim =
                    dominoMode && isSelectedWeak && affectedNodeSet.has(node.id);
                  const isIncludedPrereq = includedPrereqSet.has(node.id);
                  const isOnRepair = repairPathSet.has(node.id);

                  const borderColor =
                    node.status === 'mastered'
                      ? '#10b981'
                      : node.status === 'shaky'
                        ? '#f59e0b'
                        : '#f43f5e';

                  const nodeWidth = 178;
                  const nodeHeight = 60;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2})`}
                      onClick={() => handleNodeClick(node)}
                      className="cursor-pointer"
                    >
                      {/* Outer Glow for Selected, Domino Cascade, or Included Previous Topic */}
                      {(isSelected || isDominoVictim || isIncludedPrereq) && (
                        <rect
                          x="-5"
                          y="-5"
                          width={nodeWidth + 10}
                          height={nodeHeight + 10}
                          rx="16"
                          fill="none"
                          stroke={
                            isSelected
                              ? 'url(#dt-selected-grad)'
                              : isDominoVictim
                                ? '#f43f5e'
                                : '#a78bfa'
                          }
                          strokeWidth={isSelected ? 2.5 : 1.75}
                          strokeOpacity={isSelected ? 0.95 : 0.78}
                          strokeDasharray={
                            !isSelected && isDominoVictim ? '5 4' : undefined
                          }
                        />
                      )}

                      {/* Node Card */}
                      <rect
                        width={nodeWidth}
                        height={nodeHeight}
                        rx="14"
                        className="fill-white dark:fill-[#0E1522]"
                        stroke={borderColor}
                        strokeWidth={isSelected ? 2 : 1.5}
                      />

                      {/* Mastery Fill Strip at Bottom */}
                      <rect
                        x="10"
                        y={nodeHeight - 10}
                        width={nodeWidth - 20}
                        height="4"
                        rx="2"
                        className="fill-slate-200 dark:fill-[#1A2438]"
                      />
                      <rect
                        x="10"
                        y={nodeHeight - 10}
                        width={Math.max(
                          6,
                          ((nodeWidth - 20) * node.masteryPct) / 100,
                        )}
                        height="4"
                        rx="2"
                        fill={
                          node.masteryPct >= 95
                            ? 'url(#dt-selected-grad)'
                            : borderColor
                        }
                      />

                      {/* Node Label */}
                      <text
                        x="12"
                        y="22"
                        className="fill-slate-900 dark:fill-[#F3F4F6] text-[12px] font-bold"
                      >
                        {node.shortLabel}
                      </text>

                      {/* Cards Count & Mastery % */}
                      <text
                        x="12"
                        y="40"
                        className="fill-slate-500 dark:fill-[#9CA3AF] text-[10.5px] font-mono"
                      >
                        {node.knownCards}/{node.totalCards} карт. · {node.masteryPct}%
                      </text>

                      {/* Tags */}
                      {isDominoVictim && (
                        <g transform={`translate(${nodeWidth - 46}, -9)`}>
                          <rect width="44" height="16" rx="5" fill="#e11d48" />
                          <text
                            x="22"
                            y="11"
                            textAnchor="middle"
                            className="fill-white text-[9px] font-bold tracking-wide"
                          >
                            РИСК
                          </text>
                        </g>
                      )}

                      {!isDominoVictim && isIncludedPrereq && !isSelected && (
                        <g transform={`translate(${nodeWidth - 62}, -9)`}>
                          <rect width="60" height="16" rx="5" fill="#7c3aed" />
                          <text
                            x="30"
                            y="11"
                            textAnchor="middle"
                            className="fill-white text-[9px] font-bold"
                          >
                            ПРОШЛАЯ
                          </text>
                        </g>
                      )}

                      {!isDominoVictim &&
                        !isIncludedPrereq &&
                        isOnRepair &&
                        !isSelected && (
                          <g transform={`translate(${nodeWidth - 46}, -9)`}>
                            <rect width="44" height="16" rx="5" fill="#0284c7" />
                            <text
                              x="22"
                              y="11"
                              textAnchor="middle"
                              className="fill-white text-[9px] font-bold tracking-wide"
                            >
                              БАЗА
                            </text>
                          </g>
                        )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Sidebar: Instant Topic Cards + Previous Topics Toggle + Transfer to Section + Domino */}
          <aside className="border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0E1522] p-4 sm:p-5 overflow-y-auto space-y-4">
            {selectedNode && dominoReport && (
              <>
                {/* Selected Node Summary + Prerequisites Readiness Check + Instant Transfer CTA */}
                {(() => {
                  const directPrereqNodes = selectedNode.prereqs
                    .map((pid) => byId.get(pid))
                    .filter((n): n is ComputedSkillNode => Boolean(n));
                  const weakDirectPrereqs = directPrereqNodes.filter(
                    (p) => p.masteryPct < 50,
                  );
                  const needsFoundationFirst =
                    selectedNode.masteryPct < 50 && weakDirectPrereqs.length > 0;
                  const isReadyForAssault =
                    directPrereqNodes.length > 0 &&
                    directPrereqNodes.every((p) => p.masteryPct >= 60) &&
                    selectedNode.masteryPct < 75;

                  return (
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                              selectedNode.masteryPct >= 95
                                ? 'rainbow-mastered-badge'
                                : selectedNode.status === 'mastered'
                                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : selectedNode.status === 'shaky'
                                    ? 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {selectedNode.masteryPct >= 95
                              ? 'Мастерство'
                              : selectedNode.status === 'mastered'
                                ? 'Освоено'
                                : selectedNode.status === 'shaky'
                                  ? 'Шаткий узел'
                                  : 'Критический пробел'}
                          </span>

                          {isReadyForAssault && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-400/45 bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 text-cyan-800 dark:text-cyan-200">
                              <Sparkles className="h-3 w-3 text-emerald-500 dark:text-emerald-300" />
                              <span>Готов к штурму</span>
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {selectedNode.masteryPct}%
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-950 dark:text-[#F3F4F6]">
                        {selectedNode.label}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-[#94A3B8]">
                        {selectedNode.description}
                      </p>

                      {needsFoundationFirst && (
                        <div className="rounded-xl border border-amber-400/35 bg-amber-500/[0.08] p-3 space-y-2">
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-snug">
                            Нужна база: сначала укрепите{' '}
                            {weakDirectPrereqs.map((p) => p.shortLabel).join(', ')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {weakDirectPrereqs.map((prereq) => (
                              <button
                                key={prereq.id}
                                type="button"
                                onClick={() => setSelectedNodeId(prereq.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-400/35 text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 transition-colors cursor-pointer"
                              >
                                <span>{prereq.shortLabel}</span>
                                <span className="font-mono opacity-80">
                                  ({prereq.masteryPct}%)
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Primary Action: Transfer into Flashcards Section filtered to this selection */}
                      <button
                        type="button"
                        onClick={() => handleTransferToDeck()}
                        disabled={combinedCardIds.length === 0 && selectedNode.cardIds.length === 0}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full prism-cta disabled:opacity-40 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-cyan-300" />
                        <span>
                          Перейти в раздел карточек (
                          {combinedCardIds.length > 0
                            ? combinedCardIds.length
                            : selectedNode.cardIds.length}{' '}
                          шт.)
                        </span>
                      </button>
                    </div>
                  );
                })()}

                {/* Instant Cards Section with Previous Topics Switcher */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0B101B] p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-[#F3F4F6]">
                      <History className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      Карточки темы ({combinedCardIds.length})
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-[#94A3B8] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyUnlearned}
                        onChange={(e) => setOnlyUnlearned(e.target.checked)}
                        className="rounded border-slate-300 accent-cyan-500 cursor-pointer"
                      />
                      <span>Только невыученные</span>
                    </label>
                  </div>

                  {/* Optional Previous Topics Inclusion Switcher */}
                  {hasPrereqs && (
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-slate-200/70 dark:bg-[#131B2B] border border-slate-200/80 dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setPrevMode('current')}
                        className={`px-2 py-1.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                          prevMode === 'current'
                            ? 'prism-tab-active text-slate-950 dark:text-white'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Эта тема
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrevMode('direct')}
                        className={`px-2 py-1.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                          prevMode === 'direct'
                            ? 'bg-violet-500/20 border border-violet-400/50 text-violet-800 dark:text-violet-200'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        + Прошлая ({prereqInfo.directPrereqIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrevMode('all_ancestors')}
                        className={`px-2 py-1.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                          prevMode === 'all_ancestors'
                            ? 'bg-violet-500/20 border border-violet-400/50 text-violet-800 dark:text-violet-200'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        + Вся база ({prereqInfo.allAncestorIds.length})
                      </button>
                    </div>
                  )}

                  {/* Grouped Cards List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cardGroups.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500 dark:text-[#94A3B8]">
                        {onlyUnlearned
                          ? 'Все карточки в этой выборке уже выучены! Сними галочку «Только невыученные», чтобы повторить их.'
                          : 'В этом узле пока нет карточек.'}
                      </div>
                    ) : (
                      cardGroups.map((group) => (
                        <div key={group.node.id} className="space-y-1.5">
                          {(cardGroups.length > 1 || group.isPrevious) && (
                            <div className="flex items-center justify-between gap-2 px-1">
                              <span
                                className={`text-[11px] font-bold ${
                                  group.isPrevious
                                    ? 'text-violet-700 dark:text-violet-300'
                                    : 'text-cyan-700 dark:text-cyan-300'
                                }`}
                              >
                                {group.isPrevious
                                  ? `Прошлая тема · ${group.node.shortLabel}`
                                  : `Текущая тема · ${group.node.shortLabel}`}
                              </span>
                              <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-[#64748B]">
                                {group.cards.length} шт.
                              </span>
                            </div>
                          )}

                          {group.cards.map((card) => {
                            const sr = getCardSRState(srMap, card.id);
                            const tier = getCardVisualTier(sr);
                            const pct = getCardMasteryPercent(sr);
                            const isRainbow = tier === 'rainbow';
                            const dotColor =
                              tier === 'rainbow'
                                ? 'bg-gradient-to-tr from-rose-400 via-amber-300 via-emerald-400 to-cyan-400'
                                : tier === 'known'
                                  ? 'bg-emerald-400'
                                  : tier === 'learning'
                                    ? 'bg-cyan-400'
                                    : tier === 'hard'
                                      ? 'bg-amber-400'
                                      : tier === 'again'
                                        ? 'bg-rose-500'
                                        : 'bg-slate-400 dark:bg-slate-600';
                            const tierLabel =
                              tier === 'rainbow'
                                ? `Мастерство ${pct}%`
                                : tier === 'known'
                                  ? 'Выучено'
                                  : tier === 'learning'
                                    ? 'Хорошо'
                                    : tier === 'hard'
                                      ? 'Сложно'
                                      : tier === 'again'
                                        ? 'Не помню'
                                        : 'Новая';

                            return (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => handleTransferToDeck(card.id)}
                                className={`w-full text-left rounded-xl border px-3 py-2 text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                                  isRainbow
                                    ? 'rainbow-mastered-card'
                                    : group.isPrevious
                                      ? 'border-violet-200/80 dark:border-violet-500/25 bg-violet-50/40 dark:bg-violet-500/[0.08] hover:border-violet-400'
                                      : 'border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131B2B] hover:border-cyan-400/60'
                                }`}
                              >
                                <span
                                  className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor}`}
                                  title={tierLabel}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-900 dark:text-[#F3F4F6] line-clamp-2">
                                    №{card.id} · {card.question}
                                  </div>
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-[#64748B] shrink-0 mt-0.5" />
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Domino Impact Alert */}
                {isSelectedWeak && dominoReport.affectedNodeIds.length > 0 ? (
                  <div className="rounded-2xl border border-rose-300/80 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/[0.08] p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        Эффект домино: под угрозой {dominoReport.affectedNodeIds.length}{' '}
                        {dominoReport.affectedNodeIds.length === 1
                          ? 'тема'
                          : dominoReport.affectedNodeIds.length < 5
                            ? 'темы'
                            : 'тем'}{' '}
                        ({dominoReport.affectedCardsCount} карточек)
                      </span>
                    </div>
                    <p className="text-xs text-rose-900/90 dark:text-rose-200/85 leading-relaxed">
                      Если пойти на экзамен с пробелом в «{selectedNode.shortLabel}», по цепочке посыпятся:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dominoReport.affectedNodeIds.map((nid) => {
                        const victim = byId.get(nid);
                        if (!victim) return null;
                        return (
                          <button
                            key={nid}
                            type="button"
                            onClick={() => setSelectedNodeId(nid)}
                            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-800 dark:text-rose-200 hover:bg-rose-500/25 transition-colors cursor-pointer"
                          >
                            {victim.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : selectedNode.status === 'mastered' ? (
                  <div className="rounded-2xl border border-emerald-300/80 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/[0.08] p-3.5 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-900 dark:text-emerald-200">
                      Надёжный фундамент! Этот узел уверенно держит {dominoReport.affectedNodeIds.length} зависимых тем выше.
                    </p>
                  </div>
                ) : null}

                {/* Shortest Repair Route */}
                {dominoReport.repairPathNodeIds.length > 0 && (
                  <div className="rounded-2xl border border-cyan-200/80 dark:border-cyan-500/25 bg-cyan-50/60 dark:bg-cyan-500/[0.06] p-3.5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-300">
                      <Route className="h-4 w-4 shrink-0" />
                      <span>Кратчайший маршрут починки</span>
                    </div>
                    <ol className="space-y-1.5">
                      {dominoReport.repairPathNodeIds.map((nid, idx) => {
                        const stepNode = byId.get(nid);
                        if (!stepNode) return null;
                        return (
                          <li
                            key={nid}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedNodeId(nid)}
                              className="text-left text-slate-800 dark:text-[#E5E7EB] hover:text-cyan-600 dark:hover:text-cyan-300 truncate cursor-pointer"
                            >
                              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 mr-1.5">
                                {idx + 1}.
                              </span>
                              {stepNode.shortLabel}
                            </button>
                            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#94A3B8] shrink-0">
                              {stepNode.masteryPct}%
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    {(() => {
                      const unlearnedSet = new Set<number>();
                      const unlearnedOrdered: number[] = [];
                      const allRouteSet = new Set<number>();
                      const allRouteOrdered: number[] = [];

                      for (const nid of dominoReport.repairPathNodeIds) {
                        const rNode = byId.get(nid);
                        if (!rNode) continue;
                        for (const cid of rNode.cardIds) {
                          if (!allRouteSet.has(cid)) {
                            allRouteSet.add(cid);
                            allRouteOrdered.push(cid);
                          }
                          if (
                            !unlearnedSet.has(cid) &&
                            getCardSRState(srMap, cid).status !== 'known'
                          ) {
                            unlearnedSet.add(cid);
                            unlearnedOrdered.push(cid);
                          }
                        }
                      }

                      const repairCardIds =
                        unlearnedOrdered.length > 0
                          ? unlearnedOrdered
                          : allRouteOrdered;

                      if (repairCardIds.length === 0) return null;

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenTopicInDeck(
                              'Ремонт цепочки: ' + selectedNode.shortLabel,
                              repairCardIds,
                              repairCardIds[0],
                            );
                            onClose();
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full prism-cta cursor-pointer"
                        >
                          <span>
                            Запустить ремонт цепочки ({repairCardIds.length} карт.)
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-cyan-300" />
                        </button>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
