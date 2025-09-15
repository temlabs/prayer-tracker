import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type PrayerSession = Tables<'prayer_sessions'>

export type PrayerSessionsFilter = {
    equals?: Partial<PrayerSession>
    in?: Partial<{
        [K in keyof PrayerSession]: NonNullable<PrayerSession[K]>[]
    }>
    ilike?: Partial<
        Pick<PrayerSession, 'id' | 'member_id' | 'prayer_campaign_id'>
    >
    gte?: Partial<
        Pick<
            PrayerSession,
            'start_timestamp' | 'end_timestamp' | 'created_at' | 'updated_at'
        >
    >
    lte?: Partial<
        Pick<
            PrayerSession,
            'start_timestamp' | 'end_timestamp' | 'created_at' | 'updated_at'
        >
    >
    orderBy?: { column: keyof PrayerSession; ascending?: boolean }
    limit?: number
}

type FetchPrayerSessionsOptions = Omit<
    UseQueryOptions<PrayerSession[], Error, PrayerSession[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchPrayerSessions(
    filters?: PrayerSessionsFilter,
    config?: FetchPrayerSessionsOptions
): UseQueryResult<PrayerSession[], Error> {
    return useQuery<PrayerSession[], Error, PrayerSession[], QueryKey>({
        queryKey: ['prayer-sessions', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('prayer_sessions').select('*')

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

            if (filters?.in) {
                for (const [key, arr] of Object.entries(filters.in)) {
                    if (!arr || arr.length === 0) continue
                    const column = key as keyof PrayerSession as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = key as keyof PrayerSession as string
                    query = query.ilike(column, pattern as string)
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
                query = query.order('start_timestamp', { ascending: false })
            }

            if (typeof filters?.limit === 'number') {
                query = query.limit(filters.limit)
            }

            const { data, error } = await query
            if (error) throw error
            return data ?? []
        },
        ...config,
    })
}
