interface DataSearchProps {
    value: string;
    onChange(value: string): void;
    placeholder: string;
    label: string;
    resultCount?: number;
    totalCount?: number;
  }
  
  export function DataSearch({
    value,
    onChange,
    placeholder,
    label,
    resultCount,
    totalCount,
  }: DataSearchProps) {
    const hasSearch = value.trim().length > 0;
  
    return (
      <div className="teacher-data-search">
        <div className="teacher-search-field">
          <span
            className="teacher-search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>
  
          <input
            type="search"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={placeholder}
            aria-label={label}
            autoComplete="off"
          />
  
          {hasSearch && (
            <button
              type="button"
              className="teacher-search-clear"
              onClick={() => onChange("")}
              aria-label="Limpar busca"
            >
              Limpar
            </button>
          )}
        </div>
  
        {resultCount !== undefined &&
          totalCount !== undefined && (
            <span
              className="teacher-search-result-count"
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