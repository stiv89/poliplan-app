const DEFAULT_PAGE_SIZE = 1000

type PageResult<T> = {
  data: T[] | null
  error: { message: string } | null
}

export async function fetchAllPages<T>(
  fetchPage: (range: { from: number; to: number }) => PromiseLike<PageResult<T>>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await fetchPage({ from, to: from + pageSize - 1 })
    if (error) {
      throw new Error(error.message)
    }

    const page = data ?? []
    rows.push(...page)

    if (page.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

export function chunkValues<T>(values: T[], chunkSize = 150): T[][] {
  if (values.length === 0) return []
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }
  return chunks
}
