'use client';

interface ViewToggleButtonProps {
  currentView: 'cards' | 'map';
  onToggle: (view: 'cards' | 'map') => void;
}

export default function ViewToggleButton({ currentView, onToggle }: ViewToggleButtonProps) {
  return (
    <div className="inline-flex border border-gray-300 font-mono text-sm">
      <button
        onClick={() => onToggle('cards')}
        className={`px-6 py-2 transition-colors ${
          currentView === 'cards'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Card View
      </button>
      <button
        onClick={() => onToggle('map')}
        className={`px-6 py-2 border-l border-gray-300 transition-colors ${
          currentView === 'map'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Map View
      </button>
    </div>
  );
}
