import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type PrayerCampaign = Tables<'prayer_campaigns'>

type FetchPrayerCampaignsOptions = Omit<
    UseQueryOptions<PrayerCampaign[], Error, PrayerCampaign[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchPrayerCampaigns(
    config?: FetchPrayerCampaignsOptions
): UseQueryResult<PrayerCampaign[], Error> {
    return useQuery<PrayerCampaign[], Error, PrayerCampaign[], QueryKey>({
        queryKey: ['prayer-campaigns'],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('prayer_campaigns')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data ?? []
        },
        ...config,
    })
}
