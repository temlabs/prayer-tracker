import type { Route } from './+types/data'
import { useEffect, useMemo, useState } from 'react'
import { useFetchPrayerCampaigns } from '~/src/campaign/useFetchPrayerCampaigns'
import type { Tables } from '~/types/database.types'
import { HeadlineFigures } from '~/src/campaign/components/headlineFigures/HeadlineFigures'
import { NoCampaignsFoundPlaceholder } from '~/src/components/placeholder/NoCampaignsFoundPlaceholder'
import { useTotalHoursPrayedTimeSeries } from '~/src/campaign/useTotalHoursPrayedTimeSeries'
import { TotalHoursChart } from '~/src/campaign/components/totalHoursChart/TotalHoursChart'

export const meta: Route.MetaFunction = () => [{ title: 'Data' }]

export default function Data() {
    const { data: campaigns, status } = useFetchPrayerCampaigns()
    const firstCampaign = campaigns?.[0]
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Default to first available campaign after fetch
    useEffect(() => {
        if (!selectedId && firstCampaign) setSelectedId(firstCampaign.id)
    }, [selectedId, firstCampaign])

    const selected: Tables<'prayer_campaigns'> | undefined = useMemo(
        () => campaigns?.find((c) => c.id === selectedId) ?? firstCampaign,
        [campaigns, selectedId, firstCampaign]
    )

    const { data: series } = useTotalHoursPrayedTimeSeries(
        selected?.id,
        Boolean(selected?.id)
    )

    // Inline chart removed; using TotalHoursChart component instead

    return (
        <main className="min-h-[100svh] px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">
                    {`'` + selected?.name + `' `}Campaign Stats
                </h1>
                {campaigns && campaigns.length > 0 ? (
                    <select
                        className="rounded border border-neutral-300 px-2 py-1 text-sm"
                        value={selected?.id ?? ''}
                        onChange={(e) => setSelectedId(e.target.value)}
                    >
                        {campaigns.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                ) : null}
            </div>

            {status === 'pending' ? (
                <p className="text-sm text-neutral-600">Loading…</p>
            ) : !campaigns || campaigns.length === 0 ? (
                <NoCampaignsFoundPlaceholder />
            ) : selected ? (
                <div className="space-y-4">
                    <HeadlineFigures campaign={selected} />
                    {/* {series && selected ? (
                        <TotalHoursChart
                            campaign={selected}
                            campaignTimeSeries={series}
                        />
                    ) : null} */}
                </div>
            ) : null}
        </main>
    )
}
