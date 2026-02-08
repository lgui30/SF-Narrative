'use client';

interface ViewToggleButtonProps {
  currentView: 'cards' | 'map';
  onToggle: (view: 'cards' | 'map') => void;
}

export default function ViewToggleButton({ currentView, onToggle }: ViewToggleButtonProps) {
  return (
    <div 
      className="inline-flex border border-gray-300 font-mono text-sm"
      role="tablist"
      aria-label="View selection"
    >
      <button
        onClick={() => onToggle('cards')}
        className={`px-6 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
          currentView === 'cards'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        role="tab"
        aria-selected={currentView === 'cards'}
        aria-controls="news-view-panel"
      >
        Card View
      </button>
      <button
        onClick={() => onToggle('map')}
        className={`px-6 py-2 border-l border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
          currentView === 'map'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        role="tab"
        aria-selected={currentView === 'map'}
        aria-controls="news-view-panel"
      >
        Map View
      </button>
    </div>
  );
}
