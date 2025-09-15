import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type CampaignMember = Tables<'campaign_members'>
type PrayerCampaign = Tables<'prayer_campaigns'>

export type MemberCampaignsFilters = {
    equals?: Partial<PrayerCampaign>
    in?: Partial<{
        [K in keyof PrayerCampaign]: NonNullable<PrayerCampaign[K]>[]
    }>
    ilike?: Partial<Pick<PrayerCampaign, 'name'>>
    gte?: Partial<
        Pick<
            PrayerCampaign,
            'start_timestamp' | 'end_timestamp' | 'created_at' | 'updated_at'
        >
    >
    lte?: Partial<
        Pick<
            PrayerCampaign,
            'start_timestamp' | 'end_timestamp' | 'created_at' | 'updated_at'
        >
    >
    orderBy?: { column: keyof PrayerCampaign; ascending?: boolean }
    limit?: number
}

export type UseFetchMemberCampaignsArgs = {
    member_id: CampaignMember['member_id']
    filters?: MemberCampaignsFilters
}

export type MemberCampaignWithTarget = {
    campaign: PrayerCampaign
    individual_target_hours: CampaignMember['individual_target_hours']
}

type FetchMemberCampaignsOptions = Omit<
    UseQueryOptions<
        MemberCampaignWithTarget[],
        Error,
        MemberCampaignWithTarget[],
        QueryKey
    >,
    'queryKey' | 'queryFn'
>

export function useFetchMemberCampaigns(
    args: UseFetchMemberCampaignsArgs,
    config?: FetchMemberCampaignsOptions
): UseQueryResult<MemberCampaignWithTarget[], Error> {
    function stableKey(): string {
        const { filters } = args
        if (!filters) return ''
        const sortObject = (obj: any): any => {
            if (obj === null || typeof obj !== 'object') return obj
            if (Array.isArray(obj)) return obj.map(sortObject)
            return Object.keys(obj)
                .sort()
                .reduce((res: any, key) => {
                    res[key] = sortObject(obj[key])
                    return res
                }, {})
        }
        return JSON.stringify(sortObject(filters))
    }
    return useQuery<
        MemberCampaignWithTarget[],
        Error,
        MemberCampaignWithTarget[],
        QueryKey
    >({
        queryKey: ['member-campaigns', args.member_id ?? '', stableKey()],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase
                .from('campaign_members')
                .select('individual_target_hours, prayer_campaigns(*)')
                .eq('member_id', args.member_id)

            const filters = args.filters
            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = `prayer_campaigns.${key}`
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
                    const column = `prayer_campaigns.${key}`
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = `prayer_campaigns.${key}`
                    query = query.ilike(column, pattern as string)
                }
            }

            if (filters?.gte) {
                for (const [key, value] of Object.entries(filters.gte)) {
                    if (value === undefined) continue
                    const column = `prayer_campaigns.${key}`
                    query = query.gte(column, value as never)
                }
            }

            if (filters?.lte) {
                for (const [key, value] of Object.entries(filters.lte)) {
                    if (value === undefined) continue
                    const column = `prayer_campaigns.${key}`
                    query = query.lte(column, value as never)
                }
            }

            if (filters?.orderBy) {
                const { column, ascending = false } = filters.orderBy
                query = query.order(column as string, {
                    ascending,
                    foreignTable: 'prayer_campaigns',
                })
            }

            if (typeof filters?.limit === 'number') {
                // Limit result rows at the root level
                query = query.limit(filters.limit)
            }

            const { data, error } = await query
            if (error) throw error

            const rows = (data ?? []) as Array<{
                individual_target_hours: CampaignMember['individual_target_hours']
                prayer_campaigns: PrayerCampaign | null
            }>

            return rows
                .filter((r) => r.prayer_campaigns)
                .map((r) => ({
                    campaign: r.prayer_campaigns as PrayerCampaign,
                    individual_target_hours: r.individual_target_hours,
                }))
        },
        ...config,
    })
}
