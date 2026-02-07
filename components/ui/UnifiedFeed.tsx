'use client';

import { useMemo, useState } from 'react';
import type { FeedItem } from '@/lib/content-types';
import NewsCard from './NewsCard';
import EventCard from './EventCard';

interface UnifiedFeedProps {
  items: FeedItem[];
  loading?: boolean;
}

type TimeSection = {
  label: string;
  items: FeedItem[];
};

export default function UnifiedFeed({ items, loading = false }: UnifiedFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sections = useMemo(() => groupByTimeSection(items), [items]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-fog-gray/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="editorial-headline text-lg text-text-muted">Nothing happening yet.</p>
        <p className="text-text-muted text-xs mt-1">Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {sections.map((section) => (
        <div key={section.label}>
          {/* Sticky section header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-4 py-2">
            <h2 className="section-label">
              {section.label}
            </h2>
          </div>

          {/* Feed items */}
          <div className="space-y-3 px-4 py-3">
            {section.items.map((item, index) => {
              const baseId = getItemId(item);
              const id = `${baseId}-${index}`;
              const isExpanded = expandedId === id;
              return (
                <div key={id}>
                  {item.type === 'news' && (
                    <NewsCard
                      story={item.data}
                      expanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : id)}
                    />
                  )}
                  {item.type === 'event' && (
                    <EventCard
                      activity={item.data}
                      expanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : id)}
                    />
                  )}
                  {item.type === 'digest' && (
                    <div className="magazine-card accent-bar-teal p-4">
                      <p className="section-label mb-1">
                        {item.data.neighborhood} Digest
                      </p>
                      <p className="text-sm text-foreground">{item.data.summary}</p>
                      <p className="byline mt-1">{item.data.date}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function getItemId(item: FeedItem): string {
  switch (item.type) {
    case 'event':
      return `event-${item.data.id}`;
    case 'news':
      return `news-${item.data.id}`;
    case 'digest':
      return `digest-${item.data.neighborhood}-${item.data.date}`;
  }
}

function getItemDate(item: FeedItem): Date {
  switch (item.type) {
    case 'event':
      return new Date(item.data.date + 'T12:00:00');
    case 'news':
      return new Date(item.data.publishedAt);
    case 'digest':
      return new Date(item.data.date + 'T12:00:00');
  }
}

function groupByTimeSection(items: FeedItem[]): TimeSection[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  const today: FeedItem[] = [];
  const thisWeek: FeedItem[] = [];
  const comingUp: FeedItem[] = [];

  for (const item of items) {
    const date = getItemDate(item);
    const dateStr = date.toISOString().split('T')[0];

    if (dateStr <= todayStr) {
      today.push(item);
    } else if (dateStr <= endOfWeekStr) {
      thisWeek.push(item);
    } else {
      comingUp.push(item);
    }
  }

  const sections: TimeSection[] = [];
  if (today.length > 0) sections.push({ label: 'Today', items: today });
  if (thisWeek.length > 0) sections.push({ label: 'This Week', items: thisWeek });
  if (comingUp.length > 0) sections.push({ label: 'Coming Up', items: comingUp });

  return sections;
}
