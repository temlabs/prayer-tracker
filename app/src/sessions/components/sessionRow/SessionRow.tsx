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
    member?: Tables<'members'>
    memberName?: string
    onPress?: () => void
}

export function SessionRow({
    session,
    campaignName,
    member,
    memberName,
    onPress,
}: SessionRowProps) {
    const ended = session.end_timestamp
    if (!ended) return null
    const duration =
        typeof (session as any).duration_in_seconds === 'number'
            ? formatDuration(
                  '1970-01-01T00:00:00.000Z',
                  new Date(
                      (session as any).duration_in_seconds * 1000
                  ).toISOString()
              )
            : formatDuration(session.start_timestamp, ended)
    const relative = getRelativeTime(session.start_timestamp)
    const { label, extraDays } = formatTimeRange(session.start_timestamp, ended)
    const resolvedMemberName =
        member?.full_name ??
        (member ? `${member.first_name} ${member.last_name}` : undefined) ??
        memberName

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
                    {resolvedMemberName ? (
                        <div className="text-xs text-neutral-600">
                            {resolvedMemberName}
                        </div>
                    ) : null}
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
