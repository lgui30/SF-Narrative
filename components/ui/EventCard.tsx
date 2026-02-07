'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/content-types';
import { ExternalLink, Clock, MapPin } from 'lucide-react';

const ACCENT_BAR: Record<string, string> = {
  free: 'accent-bar-green',
  food: 'accent-bar-terra',
  community: 'accent-bar-teal',
  nightlife: 'accent-bar-purple',
  outdoor: 'accent-bar-emerald',
  events: 'accent-bar-amber',
};

interface EventCardProps {
  activity: Activity;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function EventCard({ activity, expanded = false, onToggle }: EventCardProps) {
  const [localExpanded, setLocalExpanded] = useState(expanded);
  const isExpanded = onToggle ? expanded : localExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const accentClass = ACCENT_BAR[activity.category] || 'accent-bar-neutral';

  return (
    <div
      className={`magazine-card ${accentClass} p-4 cursor-pointer`}
      onClick={handleToggle}
    >
      {/* Category label */}
      <span className="section-label">{activity.category}</span>

      {/* Title */}
      <h3 className="editorial-headline text-sm mt-1 mb-1.5">
        {activity.title}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        {activity.time && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="w-3 h-3" />
            {formatTime(activity.time)}
          </span>
        )}
        {activity.venue && (
          <span className="flex items-center gap-1 text-xs text-text-muted truncate max-w-[180px]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {formatVenue(activity.venue)}
          </span>
        )}
        {activity.price.isFree ? (
          <span className="pill-badge bg-forest-green/15 text-forest-green">Free</span>
        ) : (
          <span className="pill-badge bg-fog-gray text-foreground">
            ${activity.price.min}{activity.price.max > activity.price.min ? '+' : ''}
          </span>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 animate-fade-in">
          {activity.description && (
            <p className="text-text-muted text-sm leading-relaxed mb-3">
              {activity.description}
            </p>
          )}

          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm text-ocean-teal font-medium hover:underline"
          >
            View Details
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <p className="byline mt-2">via {activity.source}</p>
        </div>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  if (minutes === 0) return `${hour12} ${period}`;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatVenue(venue: string): string {
  if (!venue) return 'Location TBD';
  let cleaned = venue.replace(/\s*·\s*-?\s*$/, '').trim();
  cleaned = cleaned.replace(/,?\s*San Francisco,?\s*CA\s*$/i, '').trim();
  const generic = ['san francisco - the city', 'the city', 'tbd', 'n/a'];
  if (generic.includes(cleaned.toLowerCase())) return 'Location TBD';
  return cleaned || 'Location TBD';
}
