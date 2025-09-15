import {
    useInfiniteQuery,
    type UseInfiniteQueryOptions,
    type UseInfiniteQueryResult,
    type InfiniteData,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type PrayerSession = Tables<'prayer_sessions'>
type Member = Tables<'members'>
export type JoinedSession = PrayerSession & { members: Member | null }

export type InfiniteSessionFilters = {
    equals?: Partial<Pick<PrayerSession, 'member_id' | 'prayer_campaign_id'>>
    in?: Partial<{
        member_id: NonNullable<PrayerSession['member_id']>[]
        prayer_campaign_id: NonNullable<PrayerSession['prayer_campaign_id']>[]
    }>
    ilike?: Partial<Pick<PrayerSession, 'id'>>
    gte?: Partial<Pick<PrayerSession, 'start_timestamp' | 'end_timestamp'>>
    lte?: Partial<Pick<PrayerSession, 'start_timestamp' | 'end_timestamp'>>
    orderBy?: {
        column: keyof PrayerSession | 'duration_in_seconds'
        ascending?: boolean
    }
}

export type UseInfiniteSessionLogArgs = {
    filters?: InfiniteSessionFilters
    pageSize?: number
}

type Page = JoinedSession[]

export function useInfiniteSessionLog(
    args?: UseInfiniteSessionLogArgs,
    options?: Omit<
        UseInfiniteQueryOptions<
            Page,
            Error,
            InfiniteData<Page, number>,
            [string, string, number],
            number
        >,
        'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
    >
): UseInfiniteQueryResult<InfiniteData<Page, number>, Error> {
    const pageSize = args?.pageSize ?? 50
    const filters = args?.filters

    function stableKey(): string {
        if (!filters) return ''
        function sortObject<T>(obj: T): T {
            if (obj === null || typeof obj !== 'object') return obj
            if (Array.isArray(obj)) {
                return obj.map((item) => sortObject(item)) as unknown as T
            }
            const record = obj as Record<string, unknown>
            const sortedKeys = Object.keys(record).sort()
            const result: Record<string, unknown> = {}
            for (const key of sortedKeys) {
                result[key] = sortObject(record[key])
            }
            return result as T
        }
        return JSON.stringify(sortObject(filters))
    }

    return useInfiniteQuery<
        Page,
        Error,
        InfiniteData<Page, number>,
        [string, string, number],
        number
    >({
        queryKey: ['session-log', stableKey(), pageSize],
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, lastOffset) =>
            lastPage.length === pageSize ? lastOffset + pageSize : undefined,
        queryFn: async ({ pageParam }) => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('prayer_sessions').select('*, members(*)')

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof PrayerSession as string
                    if (value === null) {
                        query = query.is(column, null)
                    } else {
                        query = query.eq(column, value as never)
                    }
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = key as keyof PrayerSession as string
                    query = query.ilike(column, pattern as string)
                }
            }

            if (filters?.in) {
                for (const [key, arr] of Object.entries(filters.in)) {
                    if (!arr || arr.length === 0) continue
                    const column = key as keyof PrayerSession as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.gte) {
                for (const [key, value] of Object.entries(filters.gte)) {
                    if (value === undefined) continue
                    const column = key as keyof PrayerSession as string
                    query = query.gte(column, value as never)
                }
            }

            if (filters?.lte) {
                for (const [key, value] of Object.entries(filters.lte)) {
                    if (value === undefined) continue
                    const column = key as keyof PrayerSession as string
                    query = query.lte(column, value as never)
                }
            }

            if (filters?.orderBy) {
                const { column, ascending = false } = filters.orderBy
                query = query.order(column as string, { ascending })
            } else {
                query = query.order('end_timestamp', { ascending: false })
                query = query.order('id', { ascending: false })
            }

            const from = pageParam
            const to = pageParam + pageSize - 1
            query = query.range(from, to)

            const { data, error } = await query
            if (error) throw error
            return (data ?? []) as Page
        },
        ...options,
    })
}
