import type { Route } from './+types/members'
import { useEffect, useMemo, useState } from 'react'
import { useFetchPrayerCampaigns } from '~/src/campaign/useFetchPrayerCampaigns'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { useFetchCampaignMemberActivity } from '~/src/campaign/useFetchCampaignMemberActivity'
import type { Tables } from '~/types/database.types'
import { MemberRow } from '~/src/member/components/MemberRow'

export const meta: Route.MetaFunction = () => [{ title: 'Members' }]

export default function Members() {
    const { data: campaigns, status: campaignsStatus } =
        useFetchPrayerCampaigns()
    const firstCampaign = campaigns?.[0]
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        if (!selectedId && firstCampaign) setSelectedId(firstCampaign.id)
    }, [selectedId, firstCampaign])

    const { data: activity, status: activityStatus } =
        useFetchCampaignMemberActivity(
            {
                campaignId: selectedId ?? '',
            },
            { enabled: Boolean(selectedId) }
        )

    const { data: members } = useFetchMembers()
    const memberById = useMemo(() => {
        const map = new Map<string, Tables<'members'>>()
        if (members) {
            for (const m of members) map.set(m.id, m)
        }
        return map
    }, [members])

    return (
        <main className="min-h-[100svh] px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Campaign members</h1>
                {campaigns && campaigns.length > 0 ? (
                    <select
                        className="rounded border border-neutral-300 px-2 py-1 text-sm"
                        value={selectedId ?? ''}
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

            {campaignsStatus === 'pending' ? (
                <p className="text-sm text-neutral-600">Loading…</p>
            ) : !campaigns || campaigns.length === 0 ? (
                <p className="text-sm text-neutral-600">No campaigns found.</p>
            ) : activityStatus === 'pending' ? (
                <p className="text-sm text-neutral-600">Loading members…</p>
            ) : !activity || activity.length === 0 ? (
                <p className="text-sm text-neutral-600">
                    No members found for this campaign.
                </p>
            ) : (
                <div className="space-y-2">
                    {activity.map((a) => {
                        const m = memberById.get(a.member_id)
                        if (!m) return null
                        return (
                            <MemberRow
                                key={a.member_id}
                                activity={a}
                                member={m}
                            />
                        )
                    })}
                </div>
            )}
        </main>
    )
}
