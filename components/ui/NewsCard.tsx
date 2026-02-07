'use client';

import { useState } from 'react';
import type { NewsStory } from '@/lib/content-types';
import { ExternalLink, Clock } from 'lucide-react';

const ACCENT_BAR: Record<NewsStory['category'], string> = {
  tech: 'accent-bar-teal',
  politics: 'accent-bar-terra',
  economy: 'accent-bar-green',
  'sf-local': 'accent-bar-neutral',
};

const CATEGORY_LABELS: Record<NewsStory['category'], string> = {
  tech: 'Tech',
  politics: 'Politics',
  economy: 'Economy',
  'sf-local': 'SF Local',
};

interface NewsCardProps {
  story: NewsStory;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function NewsCard({ story, expanded = false, onToggle }: NewsCardProps) {
  const [localExpanded, setLocalExpanded] = useState(expanded);
  const isExpanded = onToggle ? expanded : localExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const accentClass = ACCENT_BAR[story.category];
  const timeAgo = formatTimeAgo(story.publishedAt);

  return (
    <div
      className={`magazine-card ${accentClass} p-4 cursor-pointer`}
      onClick={handleToggle}
    >
      {/* Header: category + neighborhood + time */}
      <div className="flex items-center gap-3 mb-1.5">
        <span className="section-label">{CATEGORY_LABELS[story.category]}</span>
        {story.neighborhood && (
          <span className="section-label">{story.neighborhood}</span>
        )}
        <span className="ml-auto flex items-center gap-1 text-[11px] text-text-muted">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </span>
      </div>

      {/* Title */}
      <h3 className="editorial-headline text-sm mb-1">
        {story.title}
      </h3>

      {/* 2-line summary teaser */}
      {!isExpanded && (
        <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{story.summary}</p>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 animate-fade-in">
          <p className="text-text-muted text-sm leading-relaxed mb-3">
            {story.summary}
          </p>

          {story.bullets && story.bullets.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {story.bullets.map((bullet, i) => (
                <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                  <span className="text-ocean-teal mt-0.5">&bull;</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {story.sources && story.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-card-border">
              {story.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-ocean-teal hover:underline"
                >
                  {source.title}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
