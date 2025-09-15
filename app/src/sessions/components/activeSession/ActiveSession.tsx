import { useEffect, useMemo, useState } from 'react'
import type { Tables } from '~/types/database.types'
import { useFetchPrayerCampaigns } from '~/src/campaign/useFetchPrayerCampaigns'
import { useUpdatePrayerSession } from '~/src/sessions/useUpdatePrayerSession'
import { useQueryClient } from '@tanstack/react-query'
import { RECENT_SESSIONS_LIMIT } from '~/src/constants/sessions'

type PrayerSession = Tables<'prayer_sessions'>

export type ActiveSessionProps = {
    session: PrayerSession
}

function formatHms(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds))
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
}

export function ActiveSession({ session }: ActiveSessionProps) {
    const startMs = useMemo(
        () => new Date(session.start_timestamp).getTime(),
        [session.start_timestamp]
    )
    const [nowMs, setNowMs] = useState<number>(() => Date.now())
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        setHydrated(true)
        const id = setInterval(() => setNowMs(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    const elapsedSeconds = (nowMs - startMs) / 1000

    const { data: campaigns } = useFetchPrayerCampaigns()
    const campaignsById = useMemo(() => {
        const map = new Map<string, string>()
        if (campaigns) {
            for (const c of campaigns) {
                map.set(c.id, c.name)
            }
        }
        return map
    }, [campaigns])
    const campaignName = session.prayer_campaign_id
        ? (campaignsById.get(session.prayer_campaign_id) ?? 'Campaign')
        : 'Campaign'

    const queryClient = useQueryClient()
    const { mutate, isPending } = useUpdatePrayerSession({
        onMutate: async (vars) => {
            await queryClient.cancelQueries({ queryKey: ['prayer-sessions'] })
            const previous = queryClient.getQueriesData({
                queryKey: ['prayer-sessions'],
            })
            // Optimistically set end_timestamp for matching session across any cached lists
            queryClient.setQueriesData<PrayerSession[]>(
                { queryKey: ['prayer-sessions'] },
                (old) => {
                    if (!old) return old
                    return old.map((s) =>
                        s.id === vars.id
                            ? {
                                  ...s,
                                  end_timestamp:
                                      vars.changes.end_timestamp ??
                                      new Date().toISOString(),
                              }
                            : s
                    )
                }
            )

            // Remove from the active list cache immediately (filters end_timestamp === null)
            queryClient.setQueriesData<PrayerSession[]>(
                {
                    queryKey: [
                        'prayer-sessions',
                        JSON.stringify({ equals: { end_timestamp: null } }),
                    ],
                },
                (old) => (old ? old.filter((s) => s.id !== vars.id) : old)
            )

            // Optimistically add to any cached recent lists for this member (end_timestamp desc)
            queryClient.setQueriesData<PrayerSession[]>(
                {
                    queryKey: ['prayer-sessions'],
                    predicate: (q) => {
                        const key = q.queryKey as readonly unknown[]
                        if (key[0] !== 'prayer-sessions') return false
                        const meta =
                            typeof key[1] === 'string' ? (key[1] as string) : ''
                        if (!meta) return false
                        try {
                            const parsed = JSON.parse(meta) as any
                            const order = parsed?.orderBy
                            const memberFilter = parsed?.equals?.member_id
                            return (
                                order?.column === 'end_timestamp' &&
                                order?.ascending === false &&
                                (!memberFilter ||
                                    memberFilter === session.member_id)
                            )
                        } catch {
                            return false
                        }
                    },
                },
                (old) => {
                    const endedAt = (vars.changes.end_timestamp ??
                        new Date().toISOString()) as string
                    const finished: PrayerSession = {
                        ...session,
                        end_timestamp: endedAt,
                    }
                    const next = old ? [finished, ...old] : [finished]
                    const dedup = Array.from(
                        new Map(next.map((s) => [s.id, s])).values()
                    )
                    return dedup.slice(0, RECENT_SESSIONS_LIMIT)
                }
            )
            return { previous } as { previous: [unknown, unknown][] }
        },
        onError: (_err, _vars, context) => {
            if (!context) return
            // restore all affected caches
            const ctx = context as { previous: [unknown, unknown][] }
            for (const [key, data] of ctx.previous) {
                queryClient.setQueryData(key as any, data)
            }
        },
    })

    function handleStop() {
        mutate({
            id: session.id,
            changes: { end_timestamp: new Date().toISOString() },
        })
    }

    return (
        <section className="flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
            <div className="min-w-0">
                <div className="text-2xl font-semibold tabular-nums">
                    {hydrated ? formatHms(elapsedSeconds) : '--:--:--'}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {campaignName}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Started {new Date(session.start_timestamp).toLocaleString()}
                </div>
            </div>
            <button
                type="button"
                onClick={handleStop}
                disabled={isPending}
                aria-label="End session"
                className="rounded-full bg-red-600 px-4 py-2 text-white disabled:opacity-60"
            >
                Stop
            </button>
        </section>
    )
}
