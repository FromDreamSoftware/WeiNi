interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PillTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
}

export default function PillTabs({ tabs, active, onChange }: PillTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
            active === tab.value
              ? 'bg-pink-400 text-white'
              : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
