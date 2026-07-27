import type {
    LucideIcon,
  } from "lucide-react";
  
  export interface PageTab {
    id: string;
    label: string;
    icon?: LucideIcon;
    count?: number;
  }
  
  interface PageTabsProps {
    tabs: PageTab[];
    activeTab: string;
  
    onChange(tabId: string): void;
  }
  
  export function PageTabs({
    tabs,
    activeTab,
    onChange,
  }: PageTabsProps) {
    return (
      <div className="ui-page-tabs">
        <div
          className="ui-page-tabs-list"
          role="tablist"
          aria-label="Seções dos resultados"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
  
            const isActive =
              tab.id === activeTab;
  
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                className={
                  isActive
                    ? "ui-page-tab is-active"
                    : "ui-page-tab"
                }
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() =>
                  onChange(tab.id)
                }
              >
                {Icon && (
                  <Icon
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                )}
  
                <span>{tab.label}</span>
  
                {tab.count !== undefined && (
                  <span className="ui-page-tab-count">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }