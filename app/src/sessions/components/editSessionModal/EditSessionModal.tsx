import { useEffect, useMemo, useState } from 'react'
import type { Tables } from '~/types/database.types'
import { useUpdatePrayerSession } from '~/src/sessions/useUpdatePrayerSession'
import { useDeletePrayerSession } from '~/src/sessions/useDeletePrayerSession'

type PrayerSession = Tables<'prayer_sessions'>
type Member = Tables<'members'>
type PrayerCampaign = Tables<'prayer_campaigns'>

export type EditSessionModalProps = {
    open: boolean
    onClose: () => void
    session: (PrayerSession & { members: Member | null }) | null
    campaigns?: PrayerCampaign[]
}

function toLocalInputValue(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function EditSessionModal({
    open,
    onClose,
    session,
    campaigns,
}: EditSessionModalProps) {
    const isActive = !!session && session.end_timestamp == null
    const [campaignId, setCampaignId] = useState<string>('')
    const [startLocal, setStartLocal] = useState<string>('')
    const [endLocal, setEndLocal] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!session) return
        setCampaignId(session.prayer_campaign_id ?? '')
        setStartLocal(toLocalInputValue(session.start_timestamp))
        setEndLocal(
            session.end_timestamp
                ? toLocalInputValue(session.end_timestamp)
                : ''
        )
        setError(null)
    }, [session])

    const startIso = useMemo(
        () => (startLocal ? new Date(startLocal).toISOString() : ''),
        [startLocal]
    )
    const endIso = useMemo(
        () => (endLocal ? new Date(endLocal).toISOString() : ''),
        [endLocal]
    )

    useEffect(() => {
        if (!startIso || !endIso) {
            setError(null)
            return
        }
        if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
            setError('End time must be after start time')
        } else {
            setError(null)
        }
    }, [startIso, endIso])

    const { mutate: updateSession, isPending } = useUpdatePrayerSession()
    const { mutate: deleteSession, isPending: deleting } =
        useDeletePrayerSession()

    function handleSave() {
        if (!session) return
        if (error) return
        const changes: Partial<
            Pick<
                PrayerSession,
                'start_timestamp' | 'end_timestamp' | 'prayer_campaign_id'
            >
        > = {}
        if (startIso) changes.start_timestamp = startIso
        if (endLocal) changes.end_timestamp = endIso
        else changes.end_timestamp = null
        if (campaignId) changes.prayer_campaign_id = campaignId
        updateSession(
            { id: session.id, changes },
            { onSuccess: () => onClose() }
        )
    }

    function handleDelete() {
        if (!session) return
        const ok = window.confirm('Delete this session? This cannot be undone.')
        if (!ok) return
        deleteSession(
            { id: session.id },
            {
                onSuccess: () => onClose(),
            }
        )
    }

    if (!open || !session) return null

    return (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4 dark:bg-black/50">
            <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl dark:bg-neutral-900 dark:text-neutral-100">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold">Edit session</h3>
                    <button
                        className="text-sm underline dark:text-neutral-200"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <p className="mb-1 text-sm font-medium">Campaign</p>
                        <select
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            value={campaignId}
                            onChange={(e) => setCampaignId(e.target.value)}
                            disabled={isPending}
                        >
                            <option value="">Select campaign…</option>
                            {campaigns?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="mb-1 text-sm font-medium">Start</p>
                            <input
                                type="datetime-local"
                                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                value={startLocal}
                                onChange={(e) => setStartLocal(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div>
                            <p className="mb-1 text-sm font-medium">End</p>
                            <input
                                type="datetime-local"
                                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                value={endLocal}
                                onChange={(e) => setEndLocal(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                    </div>
                    {error ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    ) : null}
                    {isActive ? (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            This session is currently in progress. Stop it first
                            to edit.
                        </p>
                    ) : null}
                </div>

                <div className="mt-4 flex justify-between gap-2">
                    <button
                        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60 dark:border-red-800 dark:text-red-400"
                        onClick={handleDelete}
                        disabled={isPending || deleting}
                    >
                        Delete
                    </button>
                    <button
                        className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
                        onClick={onClose}
                        disabled={isPending || deleting}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-60"
                        onClick={handleSave}
                        disabled={isPending || deleting || !!error || isActive}
                    >
                        {isPending ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
