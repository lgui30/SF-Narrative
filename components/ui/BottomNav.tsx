'use client';

import { Map, Newspaper, Search } from 'lucide-react';

type TabKey = 'map' | 'feed' | 'search';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; Icon: typeof Map }[] = [
  { key: 'map', label: 'Map', Icon: Map },
  { key: 'feed', label: 'Feed', Icon: Newspaper },
  { key: 'search', label: 'Search', Icon: Search },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card-bg/95 backdrop-blur-md border-t border-card-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-smooth ${
                isActive ? 'text-ocean-teal' : 'text-text-muted'
              }`}
            >
              <Icon
                className="w-[18px] h-[18px]"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <span className="text-[9px] font-semibold uppercase tracking-wider">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
