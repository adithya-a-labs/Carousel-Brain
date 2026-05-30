import { Navbar } from "@/components/Navbar";
import { getFounderAnalytics, type FounderAnalytics } from "@/lib/extractions";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Bookmark,
  Box,
  CheckCircle2,
  Database,
  Folder,
  Heart,
  Search,
  Server,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const ADMIN_SECRET_KEY = "carouselbrain.admin.secret";

export default function AdminAnalyticsPage() {
  const [secret, setSecret] = useState("");
  const [submittedSecret, setSubmittedSecret] = useState("");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(ADMIN_SECRET_KEY);
    if (stored) {
      setSecret(stored);
      setSubmittedSecret(stored);
    }
  }, []);

  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics", submittedSecret],
    queryFn: () => getFounderAnalytics(submittedSecret || undefined),
    retry: false,
  });

  const submitSecret = (event: React.FormEvent) => {
    event.preventDefault();
    window.sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
    setSubmittedSecret(secret);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Internal
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Founder Analytics</h1>
            <p className="text-muted-foreground mt-2">Pipeline health, retention signals, and saved-knowledge behavior.</p>
          </div>
          <form onSubmit={submitSecret} className="flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Admin secret"
              className="rounded-xl border border-border/60 bg-white/70 px-3 py-2 text-sm outline-none"
              data-testid="input-admin-secret"
            />
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))" }}
              data-testid="button-admin-load"
            >
              Load
            </button>
          </form>
        </div>

        {analyticsQuery.isLoading && <LoadingGrid />}

        {analyticsQuery.isError && (
          <div className="premium-surface rounded-3xl border border-white/60 p-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(30 90% 45%)" }} />
            <h2 className="text-xl font-bold mb-2">Analytics unavailable</h2>
            <p className="text-muted-foreground">
              Admin analytics are disabled or the secret is invalid.
            </p>
          </div>
        )}

        {analyticsQuery.data && <AnalyticsContent analytics={analyticsQuery.data} />}
      </main>
    </div>
  );
}

function AnalyticsContent({ analytics }: { analytics: FounderAnalytics }) {
  const overviewCards = [
    ["Total Extractions", analytics.overview.totalExtractions, Box],
    ["Instagram", analytics.overview.instagramExtractions, Sparkles],
    ["Uploads", analytics.overview.uploadExtractions, Upload],
    ["Successful", analytics.overview.successfulExtractions, CheckCircle2],
    ["Failed", analytics.overview.failedExtractions, AlertTriangle],
    ["Success Rate", `${analytics.overview.successRate ?? 0}%`, TrendingUp],
    ["Collections", analytics.overview.collectionsCreated, Folder],
    ["Favorites", analytics.overview.favoritesCreated, Heart],
    ["Saved Ideas", analytics.overview.savedIdeas, Bookmark],
    ["Saved Opportunities", analytics.overview.savedOpportunities, Bookmark],
    ["Searches", analytics.overview.searchQueriesPerformed, Search],
  ] as const;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map(([label, value, Icon]) => (
          <MetricCard key={label} label={label} value={value} icon={Icon} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Pipeline Health" icon={BarChart3} className="lg:col-span-2">
          <MetricRows
            rows={[
              ["Average slides", analytics.pipeline.averageSlidesExtracted],
              ["Average catalog items", analytics.pipeline.averageCatalogItemsExtracted],
              ["Average resources", analytics.pipeline.averageResourcesExtracted],
              ["Average opportunities", analytics.pipeline.averageOpportunitiesExtracted],
              ["OCR success", analytics.pipeline.ocrSuccessRate],
              ["AI success", analytics.pipeline.aiSuccessRate],
              ["Link enrichment success", analytics.pipeline.linkEnrichmentSuccessRate],
            ]}
          />
        </Panel>
        <Panel title="System Health" icon={Server}>
          <MetricRows
            rows={[
              ["Supabase", analytics.system.supabaseConnected ? "Connected" : "Fallback"],
              ["Storage", analytics.system.storageConnected ? "Configured" : "Unknown"],
              ["Backend", analytics.system.backendVersion],
              ["Uptime", `${analytics.system.uptimeSeconds}s`],
              ["Last extraction", shortDate(analytics.system.lastExtractionTime as string | null)],
            ]}
          />
        </Panel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Content Distribution" icon={BarChart3}>
          <Distribution data={analytics.contentDistribution} />
        </Panel>
        <Panel title="Search Analytics" icon={Search}>
          <MetricRows
            rows={[
              ["Search volume", analytics.search.volume],
              ["Returning results", analytics.search.returningResults],
              ["No results", analytics.search.noResults],
            ]}
          />
          <TopList title="Most searched" items={analytics.search.topTerms} />
        </Panel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Collections" icon={Folder}>
          <MetricRows rows={[["Total", analytics.collections.total], ["Avg. extractions", analytics.collections.averageExtractionsPerCollection]]} />
          <TopList title="Top collections" items={analytics.collections.topCollections.map((item) => ({ label: item.name, count: item.extractionCount }))} />
        </Panel>
        <Panel title="Favorites" icon={Heart}>
          <Distribution data={analytics.favorites.byType} />
          <TopList title="Top saved content" items={analytics.favorites.topContent} />
        </Panel>
        <Panel title="Retention" icon={TrendingUp}>
          <MetricRows
            rows={[
              ["Returning users", analytics.retention.returningUsers],
              ["Extractions / user", analytics.retention.extractionsPerUser],
              ["Collections / user", analytics.retention.collectionsPerUser],
              ["Favorites / user", analytics.retention.favoritesPerUser],
            ]}
          />
        </Panel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Content Intelligence" icon={Sparkles}>
          <TopList title="Extracted resources" items={analytics.intelligence.mostExtractedResources ?? []} />
          <TopList title="Saved ideas" items={analytics.intelligence.mostSavedProjectIdeas ?? []} />
          <TopList title="Saved opportunities" items={analytics.intelligence.mostSavedOpportunities ?? []} />
        </Panel>
        <Panel title="Quality & Edge Cases" icon={AlertTriangle}>
          <IssueLinks title="Large catalogs" items={analytics.quality.largeCatalogExtractions ?? []} />
          <IssueLinks title="Recent failures" items={(analytics.pipeline.recentFailures as Array<Record<string, unknown>>) ?? []} />
        </Panel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Recent Searches" icon={Search}>
          <div className="space-y-2">
            {analytics.search.recentSearches.slice(0, 10).map((search) => (
              <div key={`${search.term}-${search.createdAt}`} className="flex justify-between gap-3 rounded-xl bg-white/60 px-3 py-2 text-sm">
                <span className="font-medium">{search.term}</span>
                <span className="text-muted-foreground">{search.resultCount} results</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Events" icon={Database}>
          <div className="space-y-2">
            {analytics.events.recent.slice(0, 10).map((event) => (
              <div key={String(event.id)} className="rounded-xl bg-white/60 px-3 py-2 text-sm">
                <div className="font-medium">{String(event.eventType)}</div>
                <div className="text-xs text-muted-foreground">{shortDate(String(event.createdAt))}</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: unknown; icon: React.ElementType }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-surface rounded-3xl border border-white/60 p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
          <p className="text-2xl font-extrabold mt-2">{String(value)}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "hsl(248 70% 58% / 0.1)", color: "hsl(248 70% 50%)" }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

function Panel({ title, icon: Icon, className = "", children }: { title: string; icon: React.ElementType; className?: string; children: React.ReactNode }) {
  return (
    <section className={`premium-surface rounded-3xl border border-white/60 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color: "hsl(248 70% 55%)" }} />
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricRows({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <div className="grid gap-2">
      {rows.filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 rounded-xl bg-white/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-right">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function Distribution({ data }: { data: Record<string, number> }) {
  const rows = useMemo(() => Object.entries(data).sort((a, b) => b[1] - a[1]), [data]);
  const max = Math.max(1, ...rows.map(([, value]) => value));
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize text-muted-foreground">{label.replace(/_/g, " ")}</span>
            <span className="font-semibold">{value}</span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(200 70% 55%))" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopList({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 10).map((item) => (
          <span key={item.label} className="rounded-full bg-white/70 border border-border/50 px-3 py-1 text-xs font-semibold">
            {item.label} <span className="text-muted-foreground">{item.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function IssueLinks({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">{title}</p>
      <div className="space-y-2">
        {items.slice(0, 8).map((item) => (
          <Link key={String(item.id)} href={`/result/${String(item.id)}`} className="block rounded-xl bg-white/60 px-3 py-2 text-sm hover:bg-white transition-colors">
            <span className="font-medium">{String(item.title ?? item.id)}</span>
            {item.count != null && <span className="text-muted-foreground ml-2">{String(item.count)}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-28 rounded-3xl premium-surface skeleton-breathe" />
      ))}
    </div>
  );
}

function shortDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
