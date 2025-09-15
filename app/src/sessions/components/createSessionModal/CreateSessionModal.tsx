import { useEffect, useMemo, useState } from 'react'
import type { Tables } from '~/types/database.types'
import { useCreatePrayerSession } from '~/src/sessions/useCreatePrayerSession'
import { useUpdatePrayerSession } from '~/src/sessions/useUpdatePrayerSession'

type Member = Tables<'members'>
type PrayerCampaign = Tables<'prayer_campaigns'>

export type CreateSessionModalProps = {
    open: boolean
    onClose: () => void
    member: Member
    campaign: PrayerCampaign
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

export function CreateSessionModal({
    open,
    onClose,
    member,
    campaign,
}: CreateSessionModalProps) {
    const [startLocal, setStartLocal] = useState<string>('')
    const [endLocal, setEndLocal] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        const nowIso = new Date().toISOString()
        setStartLocal(toLocalInputValue(nowIso))
        setEndLocal('')
        setError(null)
    }, [open])

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

    const { mutate: create, isPending: creating } = useCreatePrayerSession()
    const { mutate: update, isPending: updating } = useUpdatePrayerSession()

    function handleSave() {
        if (!startIso || error) return
        // First create with start
        create(
            {
                member_id: member.id,
                prayer_campaign_id: campaign.id,
                start_timestamp: startIso,
            },
            {
                onSuccess: (created) => {
                    // If end provided, set it right away
                    if (endIso) {
                        update(
                            {
                                id: created.id,
                                changes: { end_timestamp: endIso },
                            },
                            { onSettled: () => onClose() }
                        )
                    } else {
                        onClose()
                    }
                },
            }
        )
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                        Log a past prayer
                    </h3>
                    <button className="text-sm underline" onClick={onClose}>
                        Close
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="mb-1 text-xs text-neutral-500">
                                Member
                            </p>
                            <div className="rounded border border-neutral-200 px-2 py-1 text-sm bg-neutral-50">
                                {member.full_name ??
                                    `${member.first_name} ${member.last_name}`}
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs text-neutral-500">
                                Campaign
                            </p>
                            <div className="rounded border border-neutral-200 px-2 py-1 text-sm bg-neutral-50">
                                {campaign.name}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="mb-1 text-sm font-medium">Start</p>
                            <input
                                type="datetime-local"
                                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                                value={startLocal}
                                onChange={(e) => setStartLocal(e.target.value)}
                                disabled={creating || updating}
                            />
                        </div>
                        <div>
                            <p className="mb-1 text-sm font-medium">End</p>
                            <input
                                type="datetime-local"
                                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                                value={endLocal}
                                onChange={(e) => setEndLocal(e.target.value)}
                                disabled={creating || updating}
                            />
                        </div>
                    </div>
                    {error ? (
                        <p className="text-xs text-red-600">{error}</p>
                    ) : null}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
                        onClick={onClose}
                        disabled={creating || updating}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-60"
                        onClick={handleSave}
                        disabled={
                            creating || updating || !startLocal || !!error
                        }
                    >
                        {creating || updating ? 'Saving…' : 'Save session'}
                    </button>
                </div>
            </div>
        </div>
    )
}
