import { Navbar } from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Filter,
  Folder,
  Layers3,
  ListChecks,
  Map,
  Plus,
  Search,
  Sparkles,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { hover, spring, staggerContainer, staggerItem, tap } from "@/lib/motion";
import { getAllExtractions } from "@/lib/extractions";
import type { DashboardExtraction, LibraryContentType } from "@/types/knowledge";
import type { CSSProperties } from "react";

type ContentFilter = "all" | LibraryContentType;
type DashboardSearchMatch = NonNullable<DashboardExtraction["searchMatches"]>[number];
type LibrarySearchResult = {
  card: DashboardExtraction;
  matches: DashboardSearchMatch[];
};

const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Productivity: { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)", dot: "hsl(248 70% 58%)" },
  Psychology: { bg: "hsl(340 75% 58% / 0.12)", text: "hsl(340 70% 46%)", dot: "hsl(340 75% 58%)" },
  Philosophy: { bg: "hsl(270 65% 58% / 0.12)", text: "hsl(270 65% 44%)", dot: "hsl(270 65% 56%)" },
  Learning: { bg: "hsl(200 70% 55% / 0.12)", text: "hsl(200 70% 40%)", dot: "hsl(200 70% 52%)" },
  Career: { bg: "hsl(30 90% 58% / 0.12)", text: "hsl(30 80% 42%)", dot: "hsl(30 90% 56%)" },
  Mindset: { bg: "hsl(150 65% 50% / 0.12)", text: "hsl(150 65% 36%)", dot: "hsl(150 65% 48%)" },
  Systems: { bg: "hsl(220 80% 62% / 0.12)", text: "hsl(220 75% 44%)", dot: "hsl(220 80% 60%)" },
  Growth: { bg: "hsl(45 90% 54% / 0.12)", text: "hsl(40 80% 38%)", dot: "hsl(45 90% 52%)" },
};

const CARD_ACCENTS = [
  "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))",
  "linear-gradient(135deg, hsl(200 70% 55%), hsl(220 75% 60%))",
  "linear-gradient(135deg, hsl(340 75% 58%), hsl(360 70% 62%))",
  "linear-gradient(135deg, hsl(270 65% 58%), hsl(290 60% 64%))",
  "linear-gradient(135deg, hsl(30 90% 58%), hsl(45 85% 62%))",
  "linear-gradient(135deg, hsl(150 65% 48%), hsl(170 60% 54%))",
  "linear-gradient(135deg, hsl(220 80% 60%), hsl(240 75% 64%))",
  "linear-gradient(135deg, hsl(310 60% 58%), hsl(330 65% 62%))",
];

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  uploading: "Uploading",
  processing: "Processing",
  analyzing: "Analyzing",
  structuring: "Structuring",
  complete: "Complete",
  failed: "Failed",
};

const CONTENT_FILTERS: Array<{
  id: ContentFilter;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "all", label: "All", icon: Archive },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { id: "playbook", label: "Playbooks", icon: ListChecks },
  { id: "roadmap", label: "Roadmaps", icon: Map },
  { id: "catalog", label: "Catalogs", icon: Layers3 },
  { id: "prompts", label: "Prompts", icon: FileText },
];

const COLLECTION_OPTIONS = ["Inbox", "Study", "Work", "Ideas", "Archive"];
const COLLECTION_STORAGE_KEY = "carouselbrain.library.collections";

const LIBRARY_LABELS: Record<LibraryContentType, string> = {
  resources: "Resources",
  opportunities: "Opportunities",
  playbook: "Playbook",
  roadmap: "Roadmap",
  catalog: "Catalog",
  prompts: "Prompts",
};

export default function DashboardPage() {
  const [activeContentType, setActiveContentType] = useState<ContentFilter>("all");
  const [activeCollection, setActiveCollection] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [collections, setCollections] = useState<Record<string, string>>({});
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["extractions"],
    queryFn: getAllExtractions,
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLECTION_STORAGE_KEY);
      if (stored) setCollections(JSON.parse(stored) as Record<string, string>);
    } catch {
      setCollections({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collections));
  }, [collections]);

  const collectionFilters = useMemo(() => {
    const values = new Set<string>(COLLECTION_OPTIONS);
    Object.values(collections).forEach((value) => values.add(value));
    return ["All", ...Array.from(values)];
  }, [collections]);

  const availableTypeCount = useMemo(() => {
    return cards.reduce<Record<string, number>>((counts, card) => {
      const type = cardLibraryType(card);
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});
  }, [cards]);

  const searchResults = useMemo<LibrarySearchResult[]>(() => {
    const query = searchQuery.trim();

    return cards.flatMap((card) => {
      const libraryType = cardLibraryType(card);
      const collection = collections[card.id] ?? "Inbox";
      const matchesType = activeContentType === "all" || libraryType === activeContentType;
      const matchesCollection = activeCollection === "All" || collection === activeCollection;
      if (!matchesType || !matchesCollection) return [];

      if (!query) return [{ card, matches: [] }];

      const directSearchTarget = [
        card.title,
        card.summary,
        card.contentType,
        libraryType,
        collection,
        ...card.tags,
      ]
        .join(" ")
        .toLowerCase();

      const blockMatches = (card.searchMatches ?? [])
        .filter((match) => matchesKeywordQuery(`${match.label} ${match.text}`, query))
        .slice(0, 5);

      const matchesSearch = directSearchTarget.includes(query.toLowerCase()) || blockMatches.length > 0;
      return matchesSearch ? [{ card, matches: blockMatches }] : [];
    });
  }, [activeCollection, activeContentType, cards, collections, searchQuery]);

  const savedCount = cards.length;
  const visibleCount = searchResults.length;
  const collectionCount = new Set(cards.map((card) => collections[card.id] ?? "Inbox")).size;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1.5">Your Library</h1>
            <p className="text-muted-foreground">Saved knowledge objects, searchable by structure and topic.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search resources, ideas, prompts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all"
                style={{ "--tw-ring-color": "hsl(248 70% 58% / 0.2)" } as CSSProperties}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Link
              href="/extract"
              className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              data-testid="button-new-extraction"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                boxShadow: "0 2px 12px hsl(248 70% 58% / 0.35)",
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Extraction</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <LibraryStat icon={Archive} label="Saved Extractions" value={savedCount} />
          <LibraryStat icon={Filter} label="Visible Now" value={visibleCount} />
          <LibraryStat icon={Folder} label="Collections" value={collectionCount} />
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/50 mr-1 shrink-0" />
            {CONTENT_FILTERS.map(({ id, label, icon: Icon }) => {
              const isActive = activeContentType === id;
              const count = id === "all" ? cards.length : availableTypeCount[id] ?? 0;
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveContentType(id)}
                  data-testid={`filter-content-${id}`}
                  whileHover={hover.subtle}
                  whileTap={tap.press}
                  transition={spring.snappy}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                  style={filterStyle(isActive)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {count > 0 && <span className={isActive ? "text-white/75" : "text-muted-foreground/60"}>{count}</span>}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Folder className="w-3.5 h-3.5 text-muted-foreground/50 mr-1 shrink-0" />
            {collectionFilters.map((collection) => (
              <motion.button
                key={collection}
                onClick={() => setActiveCollection(collection)}
                data-testid={`filter-collection-${collection.toLowerCase()}`}
                whileHover={hover.subtle}
                whileTap={tap.press}
                transition={spring.snappy}
                className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={filterStyle(activeCollection === collection)}
              >
                {collection}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="h-[268px] rounded-3xl border border-white/60 premium-surface overflow-hidden">
                  <div className="h-1 w-full" style={{ background: CARD_ACCENTS[idx] }} />
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between gap-3">
                      <div className="h-7 w-32 rounded-full bg-muted/70 skeleton-breathe" />
                      <div className="h-7 w-20 rounded-full bg-emerald-50 skeleton-breathe" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted/70 skeleton-breathe" />
                      <div className="h-4 w-1/2 rounded bg-muted/50 skeleton-breathe" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted/50 skeleton-breathe" />
                      <div className="h-3 w-2/3 rounded bg-muted/50 skeleton-breathe" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : searchResults.length > 0 ? (
            <motion.div
              key="grid"
              variants={staggerContainer(0.05, 0.03)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {searchResults.map(({ card, matches }, idx) => (
                <motion.div key={card.id} variants={staggerItem}>
                  <Link href={`/result/${card.id}`}>
                    <motion.div
                      whileHover={hover.card}
                      whileTap={tap.press}
                      transition={spring.soft}
                      data-testid={`card-extraction-${card.id}`}
                      className="group h-full rounded-3xl overflow-hidden cursor-pointer relative border border-white/60 premium-surface premium-surface-interactive"
                    >
                      <div
                        className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
                        style={{ background: CARD_ACCENTS[idx % CARD_ACCENTS.length] }}
                      />

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4 gap-2">
                          <div className="flex flex-wrap gap-1.5 min-w-0">
                            <LibraryTypeBadge type={cardLibraryType(card)} />
                            {card.tags.slice(0, 2).map((tag) => {
                              const colors = TAG_COLORS[tag] ?? TAG_COLORS.Productivity;
                              return (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                                  style={{ background: colors.bg, color: colors.text }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {STATUS_LABELS[card.status]}
                          </span>
                        </div>

                        <h3 className="text-[17px] font-bold leading-snug mb-2.5 transition-colors duration-200 group-hover:text-primary">
                          {card.title}
                        </h3>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                          {searchQuery.trim() ? <Highlight text={card.summary} query={searchQuery} /> : card.summary}
                        </p>

                        {searchQuery.trim() && (
                          <SearchMatchPreview
                            matches={matches}
                            query={searchQuery}
                            fallback={{
                              label: "Extraction",
                              text: [card.title, card.summary, card.contentType].join(" "),
                            }}
                          />
                        )}

                        <div className="grid grid-cols-2 gap-2 mb-5">
                          <CardMetric icon={Layers3} label={itemCountLabel(card)} value={libraryItemCount(card)} />
                          <CardMetric icon={CalendarDays} label="Created" value={displayDate(card)} />
                        </div>

                        <div
                          className="flex items-center justify-between gap-3 pt-4 border-t border-border/40"
                          onClick={(event) => event.preventDefault()}
                        >
                          <label className="min-w-0 flex items-center gap-2 text-xs text-muted-foreground/70">
                            <Tags className="w-3.5 h-3.5 shrink-0" />
                            <select
                              value={collections[card.id] ?? "Inbox"}
                              aria-label={`Collection for ${card.title}`}
                              data-testid={`select-collection-${card.id}`}
                              className="min-w-0 max-w-[140px] bg-white/70 border border-border/60 rounded-lg px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2"
                              style={{ "--tw-ring-color": "hsl(248 70% 58% / 0.18)" } as CSSProperties}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setCollections((current) => ({
                                  ...current,
                                  [card.id]: event.target.value,
                                }));
                              }}
                            >
                              {COLLECTION_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>

                          <motion.span
                            className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "hsl(248 70% 55%)" }}
                          >
                            Open <span className="text-base leading-none">-&gt;</span>
                          </motion.span>
                        </div>
                      </div>

                      <div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ boxShadow: "inset 0 0 0 1px hsl(248 70% 58% / 0.15), 0 12px 40px hsl(248 70% 58% / 0.1)" }}
                      />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-36 text-center"
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(248 70% 58% / 0.12), hsl(270 60% 62% / 0.08))",
                  border: "1px solid hsl(248 60% 58% / 0.15)",
                }}
              >
                <Sparkles className="w-9 h-9" style={{ color: "hsl(248 60% 60%)" }} />
              </div>
              <h3 className="text-xl font-bold mb-2">No extractions found</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">
                Try a different content type, collection, or search phrase.
              </p>
              <button
                onClick={() => {
                  setActiveContentType("all");
                  setActiveCollection("All");
                  setSearchQuery("");
                }}
                className="text-sm font-semibold transition-colors"
                style={{ color: "hsl(248 70% 55%)" }}
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function LibraryStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="premium-surface border border-white/60 rounded-2xl p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "hsl(248 70% 58% / 0.1)", color: "hsl(248 70% 50%)" }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function LibraryTypeBadge({ type }: { type: LibraryContentType }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
      style={{
        background: "hsl(248 70% 58% / 0.12)",
        color: "hsl(248 70% 46%)",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {LIBRARY_LABELS[type]}
    </span>
  );
}

function CardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  if (value === 0 || value === "") return null;

  return (
    <div className="rounded-2xl border border-border/45 bg-white/55 px-3 py-2 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 mb-1">
        <Icon className="w-3 h-3 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm font-semibold truncate">{value}</div>
    </div>
  );
}

function SearchMatchPreview({
  matches,
  query,
  fallback,
}: {
  matches: DashboardSearchMatch[];
  query: string;
  fallback: {
    label: string;
    text: string;
  };
}) {
  const visibleMatches = matches.length > 0 ? matches.slice(0, 3) : [{
    id: "fallback",
    kind: "summary" as const,
    label: fallback.label,
    text: fallback.text,
  }];

  return (
    <div className="rounded-2xl border border-border/45 bg-white/55 p-3 mb-5 space-y-2" data-testid="search-match-preview">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/65">
          <Search className="w-3 h-3" />
          Matches
        </span>
        {matches.length > 3 && (
          <span className="text-[11px] text-muted-foreground/60">+{matches.length - 3} more</span>
        )}
      </div>
      {visibleMatches.map((match) => (
        <div key={match.id} className="text-xs leading-relaxed">
          <span className="font-semibold text-foreground/70">{searchKindLabel(match.kind, match.label)}: </span>
          <span className="text-muted-foreground">
            <Highlight text={snippetAroundQuery(match.text, query)} query={query} />
          </span>
          {match.sourceSlideIndex != null && (
            <span className="ml-1 font-medium" style={{ color: "hsl(248 70% 52%)" }}>
              Slide {match.sourceSlideIndex}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = queryTerms(query);
  if (!terms.length) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  return (
    <>
      {text.split(pattern).map((part, index) => {
        const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase());
        return isMatch ? (
          <mark
            key={`${part}-${index}`}
            className="rounded px-0.5 text-foreground"
            style={{ background: "hsl(45 90% 60% / 0.28)" }}
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

function matchesKeywordQuery(value: string, query: string) {
  const haystack = value.toLowerCase();
  const terms = queryTerms(query);
  return terms.length > 0 && terms.every((term) => haystack.includes(term.toLowerCase()));
}

function queryTerms(query: string) {
  return query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 1)
    .slice(0, 5);
}

function snippetAroundQuery(text: string, query: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 150) return cleaned;

  const lower = cleaned.toLowerCase();
  const firstTerm = queryTerms(query)[0]?.toLowerCase();
  const matchIndex = firstTerm ? lower.indexOf(firstTerm) : -1;
  if (matchIndex < 0) return `${cleaned.slice(0, 150)}...`;

  const start = Math.max(0, matchIndex - 45);
  const end = Math.min(cleaned.length, matchIndex + 105);
  return `${start > 0 ? "..." : ""}${cleaned.slice(start, end)}${end < cleaned.length ? "..." : ""}`;
}

function searchKindLabel(kind: DashboardSearchMatch["kind"], label: string) {
  if (kind === "catalog") return "Catalog item";
  if (kind === "resource") return "Resource";
  if (kind === "opportunity") return "Opportunity";
  if (kind === "prompt") return "Prompt";
  if (kind === "action") return "Action";
  if (kind === "concept") return "Concept";
  if (kind === "roadmap") return "Roadmap";
  return label;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cardLibraryType(card: DashboardExtraction): LibraryContentType {
  if (card.libraryType) return card.libraryType;
  if (card.blockKinds?.includes("catalog_grid") || (card.counts?.catalogItems ?? 0) > 0) return "catalog";
  if ((card.counts?.promptTemplates ?? 0) > 0) return "prompts";
  if (card.contentType === "opportunities" || (card.counts?.opportunities ?? 0) > 1) return "opportunities";
  if (card.contentType === "resources" || (card.counts?.resources ?? 0) > 0) return "resources";
  if (card.contentType === "roadmap" || (card.counts?.roadmapStages ?? 0) > 0) return "roadmap";

  const text = `${card.title} ${card.summary} ${card.tags.join(" ")}`.toLowerCase();
  if (/\b(project ideas?|startup ideas?|app ideas?|saas ideas?|catalog|directory|collection|100\+)\b/.test(text)) return "catalog";
  if (/\b(prompts?|templates?|claude|chatgpt)\b/.test(text)) return "prompts";
  if (/\b(internships?|fellowships?|grants?|scholarships?|opportunities|stipends?|deadlines?)\b/.test(text)) return "opportunities";

  return "playbook";
}

function libraryItemCount(card: DashboardExtraction) {
  const type = cardLibraryType(card);
  if (type === "catalog" && card.counts?.catalogItems) return card.counts.catalogItems;
  if (type === "prompts" && card.counts?.promptTemplates) return card.counts.promptTemplates;
  if (type === "opportunities" && card.counts?.opportunities) return card.counts.opportunities;
  if (type === "resources" && card.counts?.resources) return card.counts.resources;
  if (type === "roadmap" && card.counts?.roadmapStages) return card.counts.roadmapStages;
  if (type === "playbook" && ((card.counts?.actionSteps ?? 0) + (card.counts?.concepts ?? 0)) > 0) {
    return (card.counts?.actionSteps ?? 0) + (card.counts?.concepts ?? 0);
  }
  if (card.itemCount) return card.itemCount;

  const visibleNumber = /\b(\d{2,3})\+?\b/.exec(`${card.title} ${card.summary}`);
  if (visibleNumber) return Number(visibleNumber[1]);

  return card.slideCount ?? 0;
}

function itemCountLabel(card: DashboardExtraction) {
  const type = cardLibraryType(card);
  if (type === "catalog") return "Items";
  if (type === "prompts") return "Prompts";
  if (type === "opportunities") return "Opportunities";
  if (type === "resources") return "Resources";
  if (type === "roadmap") return "Milestones";
  return "Signals";
}

function displayDate(card: DashboardExtraction) {
  if (!card.createdAt) return card.date;

  const createdAt = new Date(card.createdAt);
  if (Number.isNaN(createdAt.getTime())) return card.date;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(createdAt);
}

function filterStyle(active: boolean): CSSProperties {
  if (active) {
    return {
      background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
      color: "white",
      boxShadow: "0 2px 10px hsl(248 70% 58% / 0.3)",
    };
  }

  return {
    background: "rgba(255,255,255,0.7)",
    color: "hsl(240 8% 48%)",
    border: "1px solid hsl(240 12% 89%)",
  };
}
