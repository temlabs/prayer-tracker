import type { Tables } from '~/types/database.types'
import type { CampaignMemberActivityRow } from '~/src/campaign/useFetchCampaignMemberActivity'
import { useMemo } from 'react'

type Member = Tables<'members'>
type Bacenta = Tables<'bacentas'>

export type MemberRowProps = {
    activity: CampaignMemberActivityRow
    member: Member & { bacentas?: Bacenta | null }
}

function secondsToHoursLabel(seconds: number): string {
    const totalMinutes = Math.round(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
}

export function MemberRow({ activity, member }: MemberRowProps) {
    const isActive = activity.is_active
    const totalLabel = secondsToHoursLabel(activity.total_seconds_prayed)
    const bacentaName = (member as any).bacentas?.name as string | undefined
    const status = useMemo(() => {
        if (isActive) return 'Currently praying'
        if (!activity.last_seen_at) return 'No recent activity'
        const ms = Date.now() - new Date(activity.last_seen_at).getTime()
        const minutes = Math.floor(ms / 60000)
        if (minutes < 60) return `Last seen ${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `Last seen ${hours}h ago`
        const days = Math.floor(hours / 24)
        return `Last seen ${days}d ago`
    }, [isActive, activity.last_seen_at])

    return (
        <div
            className={
                'w-full rounded-md bg-white px-4 py-3 border dark:bg-neutral-900 dark:text-neutral-100 ' +
                (isActive
                    ? 'border-red-500'
                    : 'border-neutral-200 dark:border-neutral-800')
            }
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-semibold">
                        {member.full_name ??
                            `${member.first_name} ${member.last_name}`}
                    </div>
                    {bacentaName ? (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {bacentaName}
                        </div>
                    ) : null}
                    <div
                        className={
                            'text-xs ' +
                            (isActive
                                ? 'text-red-600'
                                : 'text-neutral-500 dark:text-neutral-400')
                        }
                    >
                        {status}
                    </div>
                </div>
                <div className="shrink-0 text-sm font-semibold tabular-nums">
                    {totalLabel}
                </div>
            </div>
        </div>
    )
}
