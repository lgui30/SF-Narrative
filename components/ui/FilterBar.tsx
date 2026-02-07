'use client';

interface FilterBarProps {
  categories: string[];
  neighborhoods: string[];
  activeCategory: string;
  activeNeighborhood: string;
  onCategoryChange: (cat: string) => void;
  onNeighborhoodChange: (n: string) => void;
}

export default function FilterBar({
  categories,
  neighborhoods,
  activeCategory,
  activeNeighborhood,
  onCategoryChange,
  onNeighborhoodChange,
}: FilterBarProps) {
  return (
    <div className="space-y-2 px-4 py-3">
      {/* Category text tabs with underline */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 border-b border-card-border">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`section-label whitespace-nowrap pb-2 transition-smooth ${
              activeCategory === cat
                ? 'text-ocean-teal border-b-2 border-ocean-teal'
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Neighborhood pills — smaller, muted */}
      {neighborhoods.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {neighborhoods.map((n) => (
            <button
              key={n}
              onClick={() => onNeighborhoodChange(n)}
              className={`whitespace-nowrap text-xs px-2.5 py-1 rounded transition-smooth ${
                activeNeighborhood === n
                  ? 'bg-ocean-teal text-white'
                  : 'bg-fog-gray/50 text-text-muted hover:text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
