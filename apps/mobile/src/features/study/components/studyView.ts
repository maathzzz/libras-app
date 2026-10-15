export function pagesLabel(count: number): string {
  return count === 1 ? '1 página' : `${count} páginas`;
}

/** One header segment per page: pages already reached are full. */
export function studySteps(pageCount: number, pageIndex: number): number[] {
  return Array.from({ length: pageCount }, (_, index) => (index <= pageIndex ? 1 : 0));
}
