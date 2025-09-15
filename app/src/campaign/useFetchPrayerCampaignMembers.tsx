import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type CampaignMember = Tables<'campaign_members'>

export type FetchCampaignMembersArgs = {
    prayer_campaign_id: CampaignMember['prayer_campaign_id']
    member_id?: CampaignMember['member_id']
}

type FetchCampaignMembersOptions = Omit<
    UseQueryOptions<CampaignMember[], Error, CampaignMember[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchPrayerCampaignMembers(
    args: FetchCampaignMembersArgs,
    config?: FetchCampaignMembersOptions
): UseQueryResult<CampaignMember[], Error> {
    return useQuery<CampaignMember[], Error, CampaignMember[], QueryKey>({
        queryKey: ['campaign-members', args],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('campaign_members').select('*')
            query = query.eq('prayer_campaign_id', args.prayer_campaign_id)
            if (args.member_id) {
                query = query.eq('member_id', args.member_id)
            }
            query = query.order('created_at', { ascending: false })
            const { data, error } = await query
            if (error) throw error
            return data ?? []
        },
        ...config,
    })
}
