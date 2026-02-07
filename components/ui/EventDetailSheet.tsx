'use client';

import type { Activity } from '@/lib/content-types';
import BottomSheet from './BottomSheet';
import { Clock, MapPin, ExternalLink, Tag, X } from 'lucide-react';

interface EventDetailSheetProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT_BAR: Record<string, string> = {
  free: 'accent-bar-green',
  food: 'accent-bar-terra',
  community: 'accent-bar-teal',
  nightlife: 'accent-bar-purple',
  outdoor: 'accent-bar-emerald',
  events: 'accent-bar-amber',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function EventContent({ activity, onClose, showCloseButton }: { activity: Activity; onClose: () => void; showCloseButton?: boolean }) {
  const accentClass = ACCENT_BAR[activity.category] || 'accent-bar-neutral';
  const priceLabel = activity.price.isFree
    ? 'Free'
    : activity.price.min === activity.price.max
    ? `$${activity.price.min}`
    : `$${activity.price.min}--$${activity.price.max}`;

  return (
    <div className={`space-y-3 ${accentClass} pl-3`}>
      {/* Close button + Category row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="section-label">{activity.category}</span>
        <span
          className={`pill-badge ${
            activity.price.isFree
              ? 'bg-forest-green/15 text-forest-green'
              : 'bg-fog-gray text-foreground'
          }`}
        >
          {priceLabel}
        </span>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="ml-auto text-text-muted hover:text-foreground transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="editorial-headline text-xl leading-tight">
        {activity.title}
      </h3>

      {/* Date + Time */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Clock className="w-4 h-4 flex-shrink-0 text-ocean-teal" />
        <span>
          {formatDate(activity.date)}
          {activity.time && ` · ${formatTime(activity.time)}`}
          {activity.endTime && `--${formatTime(activity.endTime)}`}
        </span>
      </div>

      {/* Venue + Neighborhood */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <MapPin className="w-4 h-4 flex-shrink-0 text-terracotta" />
        <span>
          {activity.venue}
          {activity.neighborhood && ` · ${activity.neighborhood}`}
        </span>
      </div>

      {/* Description */}
      {activity.description && (
        <p className="text-sm text-text-muted leading-relaxed">
          {activity.description}
        </p>
      )}

      {/* Tags */}
      {activity.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-text-muted" />
          {activity.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs text-text-muted bg-fog-gray rounded px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA + Source */}
      <div className="flex items-center justify-between pt-2 border-t border-card-border">
        <a
          href={activity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-ocean-teal font-medium hover:underline"
        >
          View Details <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <span className="byline">
          via {activity.source}
        </span>
      </div>
    </div>
  );
}

export default function EventDetailSheet({ activity, isOpen, onClose }: EventDetailSheetProps) {
  if (!activity) return null;

  return (
    <>
      {/* Desktop: right side panel */}
      <div
        className={`hidden md:flex absolute top-0 right-0 h-full w-[360px] z-[1000] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full w-full bg-card-bg border-l border-card-border shadow-2xl overflow-y-auto p-5">
          <EventContent activity={activity} onClose={onClose} showCloseButton />
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose}>
          <EventContent activity={activity} onClose={onClose} />
        </BottomSheet>
      </div>
    </>
  );
}
