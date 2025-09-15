import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'

export type CampaignMemberActivityRow = {
    prayer_campaign_id: string
    member_id: string
    total_seconds_prayed: number
    last_seen_at: string | null
    is_active: boolean
}

export type UseFetchCampaignMemberActivityArgs = {
    campaignId: string
}

export function useFetchCampaignMemberActivity(
    args: UseFetchCampaignMemberActivityArgs,
    options?: Omit<
        UseQueryOptions<
            CampaignMemberActivityRow[],
            Error,
            CampaignMemberActivityRow[],
            [string, string]
        >,
        'queryKey' | 'queryFn'
    >
): UseQueryResult<CampaignMemberActivityRow[], Error> {
    const { campaignId } = args

    return useQuery<
        CampaignMemberActivityRow[],
        Error,
        CampaignMemberActivityRow[],
        [string, string]
    >({
        queryKey: ['campaign-member-activity', campaignId],
        enabled: Boolean(campaignId),
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase
                .from('campaign_member_activity')
                .select('*')
                .eq('prayer_campaign_id', campaignId)

            // Active first, then most hours, then most recent last seen
            query = query
                .order('is_active', { ascending: false })
                .order('total_seconds_prayed', { ascending: false })
                .order('last_seen_at', { ascending: false, nullsFirst: false })

            const { data, error } = await query
            if (error) throw error
            // Coerce nullables safely
            return (data ?? []).map((r) => ({
                prayer_campaign_id: r.prayer_campaign_id as unknown as string,
                member_id: r.member_id as unknown as string,
                total_seconds_prayed:
                    (r.total_seconds_prayed as unknown as number) ?? 0,
                last_seen_at:
                    (r.last_seen_at as unknown as string | null) ?? null,
                is_active: Boolean(r.is_active),
            })) as CampaignMemberActivityRow[]
        },
        ...options,
    })
}
