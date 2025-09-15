import type { Route } from './+types/activity'
import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { SessionRow } from '~/src/sessions/components/sessionRow/SessionRow'
import { useInfiniteSessionLog } from '~/src/sessions/useInfiniteSessionLog'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { useFetchPrayerCampaigns } from '~/src/campaign/useFetchPrayerCampaigns'
import type { Tables } from '~/types/database.types'
import { useUpdatePrayerSession } from '~/src/sessions/useUpdatePrayerSession'

export const meta: Route.MetaFunction = () => [{ title: 'Activity Log' }]

export default function Activity() {
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()

    const memberIds = params.getAll('memberId')
    const campaignIds = params.getAll('campaignId')
    const bacentaId = params.get('bacentaId') || undefined // reserved for future joins
    const from = params.get('from') || undefined
    const to = params.get('to') || undefined

    const sort = (params.get('sort') || 'ended_desc') as
        | 'ended_desc'
        | 'ended_asc'
        | 'duration_desc'
        | 'duration_asc'

    const filters = useMemo(() => {
        const orderBy =
            sort === 'ended_asc'
                ? { column: 'end_timestamp' as const, ascending: true }
                : sort === 'ended_desc'
                  ? { column: 'end_timestamp' as const, ascending: false }
                  : sort === 'duration_asc'
                    ? {
                          column: 'duration_in_seconds' as const,
                          ascending: true,
                      }
                    : {
                          column: 'duration_in_seconds' as const,
                          ascending: false,
                      }
        return {
            equals:
                memberIds.length === 1 || campaignIds.length === 1
                    ? {
                          member_id:
                              memberIds.length === 1 ? memberIds[0] : undefined,
                          prayer_campaign_id:
                              campaignIds.length === 1
                                  ? campaignIds[0]
                                  : undefined,
                      }
                    : undefined,
            in:
                memberIds.length > 1 || campaignIds.length > 1
                    ? {
                          member_id:
                              memberIds.length > 1
                                  ? (memberIds as string[])
                                  : undefined,
                          prayer_campaign_id:
                              campaignIds.length > 1
                                  ? (campaignIds as string[])
                                  : undefined,
                      }
                    : undefined,
            gte: from ? { start_timestamp: from } : undefined,
            lte: to ? { end_timestamp: to } : undefined,
            orderBy,
        }
    }, [memberIds, campaignIds, from, to, sort])

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, status } =
        useInfiniteSessionLog({ filters, pageSize: 50 })

    type PrayerSession = Tables<'prayer_sessions'>
    type Member = Tables<'members'>
    type Joined = PrayerSession & { members: Member | null }
    type SessionPage = Joined[]
    const pages = data?.pages ?? [] // SessionPage[] from hook typing
    const rows: Joined[] = pages.flat()

    // Fetch names for descriptor and modal lists
    const { data: members } = useFetchMembers()
    const { data: campaigns } = useFetchPrayerCampaigns()

    function handleChangeParam(key: string, value?: string) {
        const next = new URLSearchParams(params)
        if (!value) next.delete(key)
        else next.set(key, value)
        setParams(next, { replace: true })
    }

    function handleChangeMulti(key: string, values: string[]) {
        const next = new URLSearchParams(params)
        next.delete(key)
        for (const v of values) next.append(key, v)
        setParams(next, { replace: true })
    }

    const [showFilters, setShowFilters] = useState(false)
    const [draftMembers, setDraftMembers] = useState<string[]>(memberIds)
    const [draftCampaigns, setDraftCampaigns] = useState<string[]>(campaignIds)
    const [draftFrom, setDraftFrom] = useState<string | undefined>(from)
    const [draftTo, setDraftTo] = useState<string | undefined>(to)

    function applyFilters() {
        const next = new URLSearchParams(params)
        next.delete('memberId')
        draftMembers.forEach((id) => next.append('memberId', id))
        next.delete('campaignId')
        draftCampaigns.forEach((id) => next.append('campaignId', id))
        if (draftFrom) next.set('from', draftFrom)
        else next.delete('from')
        if (draftTo) next.set('to', draftTo)
        else next.delete('to')
        navigate(`/activity?${next.toString()}`, { replace: true })
        setShowFilters(false)
    }

    function renderDescriptor() {
        const nameForMember = (id: string) =>
            members?.find((m) => m.id === id)?.full_name || id
        const nameForCampaign = (id: string) =>
            campaigns?.find((c) => c.id === id)?.name || id
        return (
            <>
                <span>Showing</span>
                {!from && !to ? <span> all</span> : null}
                <span> prayer activity</span>
                {memberIds.length > 0 ? (
                    <>
                        <span> by </span>
                        {memberIds.slice(0, 2).map((id, idx) => (
                            <strong key={id}>
                                {idx > 0 ? ', ' : ''}
                                {nameForMember(id)}
                            </strong>
                        ))}
                        {memberIds.length > 2 ? (
                            <strong> and {memberIds.length - 2} more</strong>
                        ) : null}
                    </>
                ) : null}
                {campaignIds.length > 0 ? (
                    <>
                        <span> for campaign </span>
                        <strong>
                            {campaignIds.map(nameForCampaign).join(', ')}
                        </strong>
                    </>
                ) : null}
                {from ? (
                    <>
                        <span> from </span>
                        <strong>{new Date(from).toLocaleString()}</strong>
                    </>
                ) : null}
                {from && to ? (
                    <>
                        <span> to </span>
                        <strong>{new Date(to).toLocaleString()}</strong>
                    </>
                ) : !from && to ? (
                    <>
                        <span> up to </span>
                        <strong>{new Date(to).toLocaleString()}</strong>
                    </>
                ) : null}
            </>
        )
    }

    // Row interactions
    const [selected, setSelected] = useState<Joined | null>(null)
    const [showEdit, setShowEdit] = useState(false)
    const [showStopFirst, setShowStopFirst] = useState(false)

    function onRowPress(s: Joined) {
        setSelected(s)
        if (s.end_timestamp == null) setShowStopFirst(true)
        else setShowEdit(true)
    }

    const { mutate: updateSession, isPending: updating } =
        useUpdatePrayerSession()

    function stopSelectedNow() {
        if (!selected) return
        updateSession({
            id: selected.id,
            changes: { end_timestamp: new Date().toISOString() },
        })
        setShowStopFirst(false)
        setSelected(null)
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

    return (
        <main className="min-h-[100svh] px-4 py-4">
            <div className="sticky top-0 gap-2 items-start flex flex-col z-10 -mx-4 mb-4 border-b border-neutral-200 bg-white px-4 py-3">
                <div className="flex w-full items-center grow justify-between gap-2">
                    <button
                        className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
                        onClick={() => setShowFilters(true)}
                    >
                        Filters
                    </button>
                    <div className="flex items-center self-end justify-end gap-2">
                        <span aria-hidden>⇅</span>
                        <select
                            className="rounded border border-neutral-300 px-2 py-1 text-sm"
                            value={sort}
                            onChange={(e) =>
                                handleChangeParam('sort', e.target.value)
                            }
                        >
                            <option value="ended_desc">End time desc</option>
                            <option value="ended_asc">End time asc</option>
                            <option value="duration_desc">Duration desc</option>
                            <option value="duration_asc">Duration asc</option>
                        </select>
                    </div>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                    <p className="text-xs text-neutral-600">
                        {renderDescriptor()}
                    </p>
                </div>
                <button
                    className="text-xs text-blue-700 underline"
                    onClick={() =>
                        setParams(new URLSearchParams(), { replace: true })
                    }
                >
                    Clear filters
                </button>
            </div>

            {status === 'pending' ? (
                <p className="text-sm text-neutral-600">Loading…</p>
            ) : rows.length === 0 ? (
                <p className="text-sm text-neutral-600">No activity found.</p>
            ) : (
                <div className="space-y-2">
                    {rows.map((s) => (
                        <SessionRow
                            key={s.id}
                            session={s}
                            member={s.members ?? undefined}
                            onPress={() => onRowPress(s)}
                        />
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div className="mt-4 flex justify-center">
                    <button
                        className="rounded border border-neutral-300 px-4 py-2 text-sm"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}

            {showFilters && (
                <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl">
                        <h3 className="mb-3 text-base font-semibold">
                            Filters
                        </h3>
                        <div className="mb-4">
                            <p className="mb-1 text-sm font-medium">Members</p>
                            <div className="max-h-40 space-y-1 overflow-auto rounded border border-neutral-200 p-2">
                                {members?.map((m) => (
                                    <label
                                        key={m.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={draftMembers.includes(
                                                m.id
                                            )}
                                            onChange={(e) => {
                                                setDraftMembers((prev) =>
                                                    e.target.checked
                                                        ? [...prev, m.id]
                                                        : prev.filter(
                                                              (id) =>
                                                                  id !== m.id
                                                          )
                                                )
                                            }}
                                        />
                                        <span>
                                            {m.full_name ??
                                                `${m.first_name} ${m.last_name}`}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="mb-1 text-sm font-medium">
                                Campaigns
                            </p>
                            <div className="max-h-40 space-y-1 overflow-auto rounded border border-neutral-200 p-2">
                                {campaigns?.map((c) => (
                                    <label
                                        key={c.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={draftCampaigns.includes(
                                                c.id
                                            )}
                                            onChange={(e) => {
                                                setDraftCampaigns((prev) =>
                                                    e.target.checked
                                                        ? [...prev, c.id]
                                                        : prev.filter(
                                                              (id) =>
                                                                  id !== c.id
                                                          )
                                                )
                                            }}
                                        />
                                        <span>{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="mb-2 grid grid-cols-2 gap-2">
                            <div>
                                <p className="mb-1 text-sm font-medium">From</p>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                                    value={draftFrom ?? ''}
                                    onChange={(e) =>
                                        setDraftFrom(
                                            e.target.value || undefined
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-sm font-medium">To</p>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                                    value={draftTo ?? ''}
                                    onChange={(e) =>
                                        setDraftTo(e.target.value || undefined)
                                    }
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
                                onClick={() => setShowFilters(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
                                onClick={applyFilters}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
