import {
    useQuery,
    useQueryClient,
    type UseQueryResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import { useFetchPrayerCampaigns } from './useFetchPrayerCampaigns'

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

function getStartOfDayTimestampMs(date: Date): number {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ).getTime()
}

/**
 * Truncate a cumulative hours time series to a specified day (inclusive).
 * - If no day is provided, truncates up to the current local day.
 * - If the specified day is after the series last `endOfDayIso`, the full series is returned.
 *
 * @param series Full cumulative series
 * @param day Target day to include up to (Date or ISO string, date-only recommended)
 * @returns Truncated series up to and including the target day
 */
export function truncateHoursSeriesToDay(
    series: HoursPoint[],
    day?: string | Date
): HoursPoint[] {
    if (!Array.isArray(series) || series.length === 0) return []

    let cutoffBase: Date
    if (day == null) {
        cutoffBase = new Date()
    } else if (typeof day === 'string') {
        const parsed = new Date(day)
        if (Number.isNaN(parsed.getTime())) return series.slice()
        cutoffBase = parsed
    } else {
        cutoffBase = day
    }

    const cutoff = new Date(cutoffBase)
    cutoff.setHours(23, 59, 59, 999)
    const cutoffIso = cutoff.toISOString()

    const last = series[series.length - 1]
    if (last.endOfDayIso <= cutoffIso) return series

    return series.filter((p) => p.endOfDayIso <= cutoffIso)
}

export function useTotalHoursPrayedTimeSeries(
    campaignId: string | undefined,
    enabled: boolean = true
): UseQueryResult<HoursPoint[], Error> {
    const { data: campaigns } = useFetchPrayerCampaigns()
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
            const startDate = new Date(rows[0].day as string)

            const campaign = campaigns?.find((c) => c.id === campaignId)
            const targetDate = campaign?.end_timestamp
                ? new Date(campaign.end_timestamp)
                : null
            const target = campaign?.target_hours ?? null

            const startDayMs = getStartOfDayTimestampMs(startDate)
            const targetDayMs = targetDate
                ? getStartOfDayTimestampMs(targetDate)
                : null

            const series = rows
                .filter((r) => !!r.day)
                .map((r) => {
                    const d = new Date(r.day as string)
                    d.setHours(23, 59, 59, 999)
                    const hours = Math.floor((r.cumulative_seconds ?? 0) / 3600)

                    const currentDayMs = getStartOfDayTimestampMs(d)
                    const dayProgress =
                        targetDayMs != null
                            ? Math.min(
                                  1,
                                  Math.max(
                                      0,
                                      (currentDayMs - startDayMs) /
                                          Math.max(1, targetDayMs - startDayMs)
                                  )
                              )
                            : null

                    return {
                        day: d.toISOString().slice(0, 10),
                        endOfDayIso: d.toISOString(),
                        hours,
                        guide:
                            target != null && dayProgress != null
                                ? dayProgress * target
                                : null,
                    }
                })
            return truncateHoursSeriesToDay(series)
        },
        staleTime: 60_000,
    })
}
