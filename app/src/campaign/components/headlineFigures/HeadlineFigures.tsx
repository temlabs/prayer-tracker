import type { Tables } from '~/types/database.types'

type PrayerCampaign = Tables<'prayer_campaigns'>

export type HeadlineFiguresProps = {
    campaign: PrayerCampaign
}

function formatHours(seconds: number): string {
    const hours = seconds / 3600
    if (hours < 10) return `${Math.round(hours * 10) / 10}`
    return `${Math.round(hours)}`
}

export function HeadlineFigures({ campaign }: HeadlineFiguresProps) {
    const totalSeconds = campaign.total_seconds_prayed ?? 0
    const totalHours = formatHours(totalSeconds)
    const target = campaign.target_hours ?? null
    const percent = target
        ? Math.min(100, Math.round((totalSeconds / (target * 3600)) * 100))
        : null

    let timeLeft: string | null = null
    if (campaign.end_timestamp) {
        const now = Date.now()
        const end = new Date(campaign.end_timestamp).getTime()
        const delta = end - now
        if (delta > 0) {
            const days = Math.floor(delta / (24 * 3600 * 1000))
            const hours = Math.floor(
                (delta % (24 * 3600 * 1000)) / (3600 * 1000)
            )
            timeLeft = `${days} days, ${hours} hours left`
        } else {
            const daysAgo = Math.abs(Math.floor(delta / (24 * 3600 * 1000)))
            timeLeft = `Ended ${daysAgo} days ago`
        }
    }

    return (
        <section className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
            <strong className="text-neutral-500 text-xs dark:text-neutral-400">
                TOTAL PRAYER TIME
            </strong>
            <div className="flex items-end gap-2">
                <div className="text-3xl font-semibold tabular-nums">
                    {totalHours} h
                </div>
                {target != null ? (
                    <div className="pb-1 text-neutral-600 dark:text-neutral-400">
                        / {target} h
                    </div>
                ) : null}
            </div>

            <div className="mt-3 h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800">
                {percent != null ? (
                    <div
                        className="h-3 rounded bg-blue-600 text-[10px] leading-3 text-white"
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                ) : (
                    <div className="h-3 w-1/3 rounded bg-neutral-300 dark:bg-neutral-700" />
                )}
            </div>
            {percent != null ? (
                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    {percent}%
                </div>
            ) : (
                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    No target
                </div>
            )}

            {timeLeft ? (
                <div className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">
                    {timeLeft}
                </div>
            ) : null}
        </section>
    )
}
