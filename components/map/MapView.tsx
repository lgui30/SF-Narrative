'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { WeeklyNews, NewsArticle } from '@/lib/types';

// Lazy load map to avoid SSR issues with Leaflet
const NeighborhoodMap = dynamic(() => import('./NeighborhoodMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] border border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="font-mono text-gray-500">Loading map...</p>
      </div>
    </div>
  )
});

export interface NeighborhoodData {
  name: string;
  articles: Array<{
    article: NewsArticle;
    category: 'tech' | 'politics' | 'economy' | 'sf-local';
  }>;
  counts: {
    tech: number;
    politics: number;
    economy: number;
    sfLocal: number;
    total: number;
  };
}

interface MapViewProps {
  weeklyNews: WeeklyNews;
  selectedNeighborhood: string | null;
  onNeighborhoodSelect: (neighborhood: string | null) => void;
}

export default function MapView({ weeklyNews, selectedNeighborhood, onNeighborhoodSelect }: MapViewProps) {
  const [geoJson, setGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tech' | 'politics' | 'economy' | 'sf-local'>('all');

  // Load GeoJSON file
  useEffect(() => {
    fetch('/data/sf-neighborhoods.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load GeoJSON');
        return res.json();
      })
      .then(data => {
        setGeoJson(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load GeoJSON:', err);
        setError('Failed to load map data');
        setLoading(false);
      });
  }, []);

  // Reset category filter when neighborhood changes
  useEffect(() => {
    setSelectedCategory('all');
  }, [selectedNeighborhood]);

  // Aggregate articles by neighborhood
  const neighborhoodData = useMemo(() => {
    const map = new Map<string, NeighborhoodData>();

    [
      { category: 'tech' as const, sources: weeklyNews.tech.sources },
      { category: 'politics' as const, sources: weeklyNews.politics.sources },
      { category: 'economy' as const, sources: weeklyNews.economy.sources },
      { category: 'sf-local' as const, sources: weeklyNews.sfLocal.sources }
    ].forEach(({ category, sources }) => {
      sources.forEach(article => {
        const neighborhoods = article.neighborhoods || [];

        // Only add to specific neighborhoods, NOT "General SF"
        neighborhoods.forEach(neighborhood => {
          if (neighborhood !== 'General SF') {
            if (!map.has(neighborhood)) {
              map.set(neighborhood, {
                name: neighborhood,
                articles: [],
                counts: { tech: 0, politics: 0, economy: 0, sfLocal: 0, total: 0 }
              });
            }
            const data = map.get(neighborhood)!;
            data.articles.push({ article, category });
            data.counts[category === 'sf-local' ? 'sfLocal' : category]++;
            data.counts.total++;
          }
        });
      });
    });

    return map;
  }, [weeklyNews]);

  if (loading) {
    return (
      <div className="h-[600px] border border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="font-mono text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !geoJson) {
    return (
      <div className="h-[600px] border border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-red-500 mb-2">{error || 'Map unavailable'}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              // Retry loading
              fetch('/data/sf-neighborhoods.geojson')
                .then(res => res.json())
                .then(data => {
                  setGeoJson(data);
                  setLoading(false);
                })
                .catch(err => {
                  setError('Failed to load map data');
                  setLoading(false);
                });
            }}
            className="text-xs font-mono border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get articles for selected neighborhood
  const selectedNeighborhoodArticles = selectedNeighborhood && neighborhoodData.get(selectedNeighborhood);

  // Filter articles by selected category
  const filteredArticles = selectedNeighborhoodArticles?.articles.filter(({ category }) =>
    selectedCategory === 'all' || category === selectedCategory
  ) || [];

  return (
    <>
      <div className="border border-gray-300">
        <NeighborhoodMap
          geoJsonData={geoJson}
          neighborhoodData={neighborhoodData}
          selectedNeighborhood={selectedNeighborhood}
          onNeighborhoodSelect={onNeighborhoodSelect}
        />
      </div>

      {/* Neighborhood News Cards Below Map */}
      {selectedNeighborhood && selectedNeighborhoodArticles && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-mono font-bold">
              {selectedNeighborhood} News
            </h3>
            <button
              onClick={() => onNeighborhoodSelect(null)}
              className="text-sm font-mono border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Clear Selection
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="border border-gray-300 p-6">
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-xs font-mono px-4 py-2 border transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({selectedNeighborhoodArticles.counts.total})
              </button>
              {selectedNeighborhoodArticles.counts.tech > 0 && (
                <button
                  onClick={() => setSelectedCategory('tech')}
                  className={`text-xs font-mono px-4 py-2 border transition-colors ${
                    selectedCategory === 'tech'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Tech ({selectedNeighborhoodArticles.counts.tech})
                </button>
              )}
              {selectedNeighborhoodArticles.counts.politics > 0 && (
                <button
                  onClick={() => setSelectedCategory('politics')}
                  className={`text-xs font-mono px-4 py-2 border transition-colors ${
                    selectedCategory === 'politics'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Politics ({selectedNeighborhoodArticles.counts.politics})
                </button>
              )}
              {selectedNeighborhoodArticles.counts.economy > 0 && (
                <button
                  onClick={() => setSelectedCategory('economy')}
                  className={`text-xs font-mono px-4 py-2 border transition-colors ${
                    selectedCategory === 'economy'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Economy ({selectedNeighborhoodArticles.counts.economy})
                </button>
              )}
              {selectedNeighborhoodArticles.counts.sfLocal > 0 && (
                <button
                  onClick={() => setSelectedCategory('sf-local')}
                  className={`text-xs font-mono px-4 py-2 border transition-colors ${
                    selectedCategory === 'sf-local'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  SF Local ({selectedNeighborhoodArticles.counts.sfLocal})
                </button>
              )}
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.length === 0 ? (
                <p className="text-sm font-mono text-gray-500 text-center py-4">
                  No articles in this category
                </p>
              ) : (
                filteredArticles.map(({ article, category }, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono px-2 py-1 ${
                      category === 'tech' ? 'bg-blue-100 text-blue-800' :
                      category === 'politics' ? 'bg-purple-100 text-purple-800' :
                      category === 'economy' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {category === 'sf-local' ? 'SF Local' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <div className="flex-1">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono font-bold hover:underline"
                      >
                        {article.title}
                      </a>
                      <p className="text-xs font-mono text-gray-600 mt-1">{article.snippet}</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">Source: {article.source}</p>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
