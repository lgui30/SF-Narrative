'use client';

interface NeighborhoodIdentity {
  tagline: string;
  description: string;
}

interface NeighborhoodCardProps {
  neighborhood: string;
  identity: NeighborhoodIdentity;
  eventCount: number;
  newsCount: number;
}

export default function NeighborhoodCard({
  neighborhood,
  identity,
  eventCount,
  newsCount,
}: NeighborhoodCardProps) {
  return (
    <div className="card-hover">
      <h3 className="text-xl font-bold text-foreground mb-1">{neighborhood}</h3>
      <p className="text-sm font-medium text-terracotta mb-3">{identity.tagline}</p>
      <p className="text-sm text-text-muted leading-relaxed mb-4">{identity.description}</p>

      <div className="flex items-center gap-2 mb-4">
        {eventCount > 0 && (
          <span className="pill-badge bg-ocean-teal/15 text-ocean-teal">
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
        )}
        {newsCount > 0 && (
          <span className="pill-badge bg-forest-green/15 text-forest-green">
            {newsCount} article{newsCount !== 1 ? 's' : ''}
          </span>
        )}
        {eventCount === 0 && newsCount === 0 && (
          <span className="pill-badge bg-fog-gray text-text-muted">
            No activity yet
          </span>
        )}
      </div>

      <button className="w-full py-2.5 rounded-lg text-sm font-medium bg-ocean-teal text-white hover:bg-ocean-teal/90 transition-smooth">
        See all
      </button>
    </div>
  );
}
