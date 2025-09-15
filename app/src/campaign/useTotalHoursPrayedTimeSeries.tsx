import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'

export type CampaignCumulativeRow = {
    campaign_id: string | null
    day: string | null // ISO date (YYYY-MM-DD or full ISO), treated as date-only
    cumulative_seconds: number | null
}

export type HoursPoint = {
    day: string // same as input day (date-only ISO)
    endOfDayIso: string // ISO at 23:59:59.999 local time
    hours: number // cumulative hours at end of day
}

export function useTotalHoursPrayedTimeSeries(
    campaignId: string | undefined,
    enabled: boolean = true
): UseQueryResult<HoursPoint[], Error> {
    return useQuery<HoursPoint[], Error>({
        queryKey: ['campaign-cumulative', campaignId ?? ''],
        enabled: Boolean(campaignId) && enabled,
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('campaign_cumulative_view')
                .select('*')
                .eq('campaign_id', campaignId as string)
                .order('day', { ascending: true })

            if (error) throw error
            const rows = (data as unknown as CampaignCumulativeRow[]) ?? []
            return rows
                .filter((r) => !!r.day)
                .map((r) => {
                    const d = new Date(r.day as string)
                    d.setHours(23, 59, 59, 999)
                    const hours = (r.cumulative_seconds ?? 0) / 3600
                    return {
                        day: new Date(r.day as string)
                            .toISOString()
                            .slice(0, 10),
                        endOfDayIso: d.toISOString(),
                        hours,
                    }
                })
        },
        staleTime: 60_000,
    })
}
