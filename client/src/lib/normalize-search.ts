export function normalizeSearch(
    value: string | null | undefined,
  ): string {
    return (value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }