import type { Tables } from '~/types/database.types'
import {
    getRelativeTime,
    formatTimeRange,
    formatDuration,
} from '~/src/formatting/dateTime/getRelativeTime'

type PrayerSession = Tables<'prayer_sessions'>

export type SessionRowProps = {
    session: PrayerSession
    campaignName?: string
    onPress?: () => void
}

export function SessionRow({
    session,
    campaignName,
    onPress,
}: SessionRowProps) {
    const ended = session.end_timestamp
    if (!ended) return null
    const duration = formatDuration(session.start_timestamp, ended)
    const relative = getRelativeTime(session.start_timestamp)
    const { label, extraDays } = formatTimeRange(session.start_timestamp, ended)

    return (
        <button
            type="button"
            onClick={onPress}
            className="w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-left hover:bg-neutral-50"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-semibold tabular-nums">{duration}</div>
                    <div className="text-xs text-neutral-600">
                        {relative}
                        {campaignName ? ` • ${campaignName}` : ''}
                    </div>
                    <div className="text-xs text-neutral-500">
                        {label}
                        {extraDays > 0 ? ` (+${extraDays})` : ''}
                    </div>
                </div>
                <div aria-hidden className="text-neutral-400">
                    ›
                </div>
            </div>
        </button>
    )
}
