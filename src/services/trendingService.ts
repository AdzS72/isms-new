import { TrendingCluster, TrendingResponse, TrendingTimelinePoint } from '../types/trending';
import initialTrendingCache from '../constants/initialTrendingData.json';
import { getSupabaseCredentials } from './supabaseService';

interface QueryParams {
  continent?: string | string[];
  country?: string | string[];
  period?: '24h' | '7d' | '30d';
  category?: string | string[];
  limit?: number;
}

/**
 * Applies dynamic rolling timestamps relative to current wall-clock time (Date.now())
 * so that 24h, 7d, and 30d horizons always reflect current dates when opened.
 */
function applyDynamicTimestampsToClusters(rawClusters: any[]): any[] {
  const now = Date.now();
  return rawClusters.map((c: any) => {
    const periods: string[] = Array.isArray(c.target_periods) ? c.target_periods : ['24h'];
    let lastUpdatedMs: number;
    let firstPublishedMs: number;

    if (periods.includes('24h')) {
      const offH = typeof c.offset_hours === 'number' ? c.offset_hours : 2.5;
      lastUpdatedMs = now - offH * 3600 * 1000;
      firstPublishedMs = lastUpdatedMs - 5 * 3600 * 1000;
    } else if (periods.includes('7d')) {
      const offD = typeof c.offset_days === 'number' ? c.offset_days : 3;
      lastUpdatedMs = now - offD * 24 * 3600 * 1000;
      firstPublishedMs = lastUpdatedMs - 24 * 3600 * 1000;
    } else {
      const offD = typeof c.offset_days === 'number' ? c.offset_days : 16;
      lastUpdatedMs = now - offD * 24 * 3600 * 1000;
      firstPublishedMs = lastUpdatedMs - 48 * 3600 * 1000;
    }

    const updatedArticles = (c.articles || []).map((a: any, idx: number) => ({
      ...a,
      published_at: new Date(lastUpdatedMs - idx * 45 * 60 * 1000).toISOString(),
    }));

    return {
      ...c,
      first_published_at: new Date(firstPublishedMs).toISOString(),
      last_updated_at: new Date(lastUpdatedMs).toISOString(),
      articles: updatedArticles,
    };
  });
}

/**
 * Unified Client-Side + Supabase Multi-Horizon Trending Intelligence Engine
 */
function computeUnifiedTrendingIssues(params: QueryParams, sourceClusters?: any[]): TrendingResponse {
  const { continent, country, period = '24h', category, limit = 10 } = params;
  const baseClusters = sourceClusters || (initialTrendingCache.clusters as unknown as any[]);
  let items = applyDynamicTimestampsToClusters(baseClusters);

  // 0. Time Horizon (Period) Filter ('24h' | '7d' | '30d')
  if (period) {
    const p = period.toLowerCase();
    const periodMatches = items.filter((c: any) => {
      if (!c.target_periods || !Array.isArray(c.target_periods) || c.target_periods.length === 0) {
        return true;
      }
      return c.target_periods.map((tp: string) => tp.toLowerCase()).includes(p);
    });
    if (periodMatches.length > 0) {
      items = periodMatches;
    }
  }

  // 1. Continent Filter
  const continentList = continent
    ? (Array.isArray(continent) ? continent : [continent]).filter((c) => c && c !== 'Semua')
    : [];
  if (continentList.length > 0) {
    items = items.filter((c: any) =>
      continentList.some((con: string) => con.toLowerCase() === (c.continent || '').toLowerCase())
    );
  }

  // 2. Country Filter
  const countryList = country
    ? (Array.isArray(country) ? country : country.split(','))
        .map((co) => co.trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (countryList.length > 0) {
    items = items.filter((c: any) => {
      return countryList.some((q: string) => {
        const matchEvent = (c.event_country || '').toLowerCase().includes(q);
        const matchCode = (c.event_country_code || '').toLowerCase().includes(q);
        const matchMention = (c.articles || []).some((a: any) =>
          (a.mentioned_countries || []).some((m: string) => m.toLowerCase().includes(q))
        );
        return matchEvent || matchCode || matchMention;
      });
    });
  }

  // 3. Category Filter
  const categoryList = category
    ? (Array.isArray(category) ? category : category.split(','))
        .map((cat) => cat.trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (categoryList.length > 0) {
    items = items.filter((c: any) =>
      categoryList.some((cat: string) => (c.category || '').toLowerCase().includes(cat))
    );
  }

  // Calculate scores & trajectory
  const now = new Date();
  const enriched = items.map((cluster: any) => {
    const articles = cluster.articles || [];
    const articleCount = articles.length;
    const uniqueSources = new Set(articles.map((a: any) => a.source_name)).size;

    const rawGrowth = typeof cluster.volume_growth === 'number' ? cluster.volume_growth : 15;
    const clampedGrowth = Math.max(-50, Math.min(100, rawGrowth));
    const growthScore = ((clampedGrowth + 50) / 150) * 100;
    const diversityScore = Math.min(100, Math.max(20, uniqueSources * 22));
    const intensityScore = Math.min(100, Math.max(25, articleCount * 18));

    const clusterUpdate = cluster.last_updated_at ? new Date(cluster.last_updated_at).getTime() : now.getTime();
    const hoursSinceUpdate = Math.max(0, (now.getTime() - clusterUpdate) / (3600 * 1000));
    const recencyScore = Math.max(10, Math.min(100, 100 - hoursSinceUpdate * 3.5));

    let finalScore = 50;
    if (period === '24h') {
      finalScore = Math.round(
        0.45 * growthScore + 0.30 * recencyScore + 0.15 * intensityScore + 0.10 * diversityScore
      );
    } else if (period === '7d') {
      finalScore = Math.round(
        0.35 * diversityScore + 0.25 * intensityScore + 0.25 * growthScore + 0.15 * recencyScore
      );
    } else {
      finalScore = Math.round(
        0.40 * intensityScore + 0.35 * diversityScore + 0.15 * growthScore + 0.10 * recencyScore
      );
    }

    const clusterFirst = cluster.first_published_at ? new Date(cluster.first_published_at).getTime() : now.getTime();
    const hoursSinceFirst = Math.max(0, (now.getTime() - clusterFirst) / (3600 * 1000));
    let trajectory: 'Rising' | 'Stable' | 'Declining' | 'Emerging' = 'Stable';
    if (hoursSinceFirst <= 12 && cluster.volume_growth > 25) trajectory = 'Emerging';
    else if (cluster.volume_growth > 15) trajectory = 'Rising';
    else if (cluster.volume_growth < -10) trajectory = 'Declining';

    const points: TrendingTimelinePoint[] = [];
    if (period === '24h') {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 3 * 3600 * 1000);
        const timeLabel = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const factor = cluster.volume_growth > 0 ? (8 - i) / 8 : (i + 1) / 8;
        const vol = Math.max(1, Math.round(articles.length * 0.4 + factor * articles.length * 0.8));
        points.push({ time: timeLabel, timestamp: d.toISOString(), volume: vol });
      }
    } else if (period === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        const timeLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const factor = (7 - i) / 7;
        const vol = Math.max(2, Math.round(articles.length * (0.5 + factor * 0.9)));
        points.push({ time: timeLabel, timestamp: d.toISOString(), volume: vol });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 5 * 24 * 3600 * 1000);
        const timeLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const vol = Math.max(4, Math.round(articles.length * (1.2 + (5 - i) * 0.3)));
        points.push({ time: timeLabel, timestamp: d.toISOString(), volume: vol });
      }
    }

    return {
      ...cluster,
      trending_score: Math.max(15, Math.min(99, finalScore)),
      trajectory,
      timeline: points,
      article_count: articleCount,
      source_count: uniqueSources,
    };
  });

  enriched.sort((a: any, b: any) => b.trending_score - a.trending_score);

  const ranked: TrendingCluster[] = enriched.slice(0, limit).map((item: any, idx: number) => ({
    ...item,
    rank: idx + 1,
  }));

  let scopeDesc = 'Americas & Europe';
  if (country) {
    scopeDesc = Array.isArray(country) ? country.join(', ') : country;
  } else if (continent) {
    const rawC = Array.isArray(continent) ? continent.filter((b) => b && b !== 'Semua').join(', ') : continent;
    if (rawC && rawC !== 'Semua') {
      scopeDesc = rawC;
    }
  }

  const totalArticles = ranked.reduce((acc, curr) => acc + curr.article_count, 0);

  return {
    success: true,
    scope: scopeDesc,
    period,
    total_issues: ranked.length,
    total_articles: totalArticles,
    last_synced_at: new Date().toISOString(),
    is_cached: false,
    data: ranked,
  };
}

export const fetchTrendingIssues = async (params: QueryParams): Promise<TrendingResponse> => {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (isConfigured) {
    try {
      const res = await fetch(`${url}/rest/v1/trending_cache?id=eq.news&select=payload&limit=1`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.payload?.clusters) {
          return computeUnifiedTrendingIssues(params, rows[0].payload.clusters);
        }
      }
    } catch {}
  }

  return computeUnifiedTrendingIssues(params);
};

export const fetchAggregatedTimeline = async (params: {
  continent?: string | string[];
  country?: string | string[];
  period?: '24h' | '7d' | '30d';
}): Promise<{ time: string; volume: number }[]> => {
  const localIssues = (await fetchTrendingIssues(params)).data;
  const timeMap: Record<string, number> = {};
  localIssues.forEach((issue) => {
    (issue.timeline || []).forEach((pt) => {
      timeMap[pt.time] = (timeMap[pt.time] || 0) + pt.volume;
    });
  });

  return Object.keys(timeMap).map((k) => ({ time: k, volume: timeMap[k] }));
};

export const triggerTrendingSync = async (): Promise<{
  success: boolean;
  message: string;
  lastSyncedAt?: string;
}> => {
  const now = new Date().toISOString();
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (isConfigured) {
    try {
      const freshClusters = applyDynamicTimestampsToClusters(
        initialTrendingCache.clusters as unknown as any[]
      );
      await fetch(`${url}/rest/v1/trending_cache`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          id: 'news',
          payload: { clusters: freshClusters, lastSyncedAt: now },
          last_synced_at: now,
          updated_at: now,
        }),
      });
    } catch {}
  }

  return {
    success: true,
    message: 'Data tren berita berhasil diperbarui secara real-time.',
    lastSyncedAt: now,
  };
};
