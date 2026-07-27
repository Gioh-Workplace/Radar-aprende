import {
    Search,
    X,
  } from "lucide-react";
  
  interface SearchFieldProps {
    id: string;
    value: string;
    onChange(value: string): void;
    label: string;
    placeholder: string;
    resultCount?: number;
    totalCount?: number;
  }
  
  export function SearchField({
    id,
    value,
    onChange,
    label,
    placeholder,
    resultCount,
    totalCount,
  }: SearchFieldProps) {
    const hasSearch =
      value.trim().length > 0;
  
    return (
      <div className="ui-search">
        <label
          htmlFor={id}
          className="ui-search-label"
        >
          {label}
        </label>
  
        <div className="ui-search-control">
          <Search
            className="ui-search-icon"
            size={18}
            strokeWidth={1.9}
            aria-hidden="true"
          />
  
          <input
            id={id}
            type="text"
            inputMode="search"
            role="searchbox"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={placeholder}
            autoComplete="off"
          />
  
          {hasSearch && (
            <button
              type="button"
              className="ui-search-clear"
              onClick={() => onChange("")}
              aria-label="Limpar pesquisa"
            >
              <X
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
  
        {resultCount !== undefined &&
          totalCount !== undefined && (
            <span
              className="ui-search-result"
              aria-live="polite"
            >
              {hasSearch
                ? `${resultCount} de ${totalCount}`
                : `${totalCount} ${
                    totalCount === 1
                      ? "registro"
                      : "registros"
                  }`}
            </span>
          )}
      </div>
    );
  }