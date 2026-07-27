import type {
    LucideIcon,
  } from "lucide-react";
  import type {
    KeyboardEvent,
  } from "react";
  
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
    function activateTab(
      tabId: string,
    ) {
      onChange(tabId);
  
      requestAnimationFrame(() => {
        document
          .getElementById(
            `tab-${tabId}`,
          )
          ?.focus();
      });
    }
  
    function handleKeyDown(
      event:
        KeyboardEvent<HTMLButtonElement>,
      currentIndex: number,
    ) {
      let nextIndex: number;
  
      switch (event.key) {
        case "ArrowRight":
          nextIndex =
            (currentIndex + 1) %
            tabs.length;
          break;
  
        case "ArrowLeft":
          nextIndex =
            (currentIndex -
              1 +
              tabs.length) %
            tabs.length;
          break;
  
        case "Home":
          nextIndex = 0;
          break;
  
        case "End":
          nextIndex =
            tabs.length - 1;
          break;
  
        default:
          return;
      }
  
      event.preventDefault();
  
      const nextTab =
        tabs[nextIndex];
  
      if (nextTab) {
        activateTab(nextTab.id);
      }
    }
  
    return (
      <div className="ui-page-tabs">
        <div
          className="ui-page-tabs-list"
          role="tablist"
          aria-label="Seções dos resultados"
        >
          {tabs.map(
            (tab, index) => {
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
                  aria-selected={
                    isActive
                  }
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={
                    isActive ? 0 : -1
                  }
                  onClick={() =>
                    onChange(tab.id)
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(
                      event,
                      index,
                    )
                  }
                >
                  {Icon && (
                    <Icon
                      size={16}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  )}
  
                  <span>
                    {tab.label}
                  </span>
  
                  {tab.count !==
                    undefined && (
                    <span className="ui-page-tab-count">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>
    );
  }