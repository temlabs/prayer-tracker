import {
    useMutation,
    useQueryClient,
    type UseMutationOptions,
    type UseMutationResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesUpdate } from '~/types/database.types'
import type { InfiniteData } from '@tanstack/react-query'
import type { JoinedSession } from '~/src/sessions/useInfiniteSessionLog'

type PrayerSession = Tables<'prayer_sessions'>

export type UpdatePrayerSessionInput = {
    id: PrayerSession['id']
    changes: Partial<
        Pick<
            PrayerSession,
            'start_timestamp' | 'end_timestamp' | 'prayer_campaign_id'
        >
    >
}

export function useUpdatePrayerSession(
    options?: UseMutationOptions<PrayerSession, Error, UpdatePrayerSessionInput>
): UseMutationResult<PrayerSession, Error, UpdatePrayerSessionInput> {
    const queryClient = useQueryClient()

    return useMutation<PrayerSession, Error, UpdatePrayerSessionInput>({
        mutationFn: async ({ id, changes }) => {
            const supabase = getSupabaseBrowserClient()
            const payload: TablesUpdate<'prayer_sessions'> = {
                ...changes,
            }
            const { data, error } = await supabase
                .from('prayer_sessions')
                .update(payload)
                .eq('id', id)
                .select('*')
                .single()

            if (error) throw error
            return data as PrayerSession
        },
        onMutate: async (vars) => {
            await queryClient.cancelQueries({ queryKey: ['prayer-sessions'] })
            // If caller supplied their own onMutate, defer to them entirely
            if (options?.onMutate) {
                // Delegate to caller if they provided custom onMutate
                // Cast to unknown to satisfy differing context expectations
                return (
                    options.onMutate as unknown as (
                        v: UpdatePrayerSessionInput
                    ) => unknown
                )(vars)
            }
            const previous = queryClient.getQueriesData({
                queryKey: ['prayer-sessions'],
            })
            // Optimistically apply changes across any cached lists
            queryClient.setQueriesData<PrayerSession[]>(
                { queryKey: ['prayer-sessions'] },
                (old) => {
                    if (!old) return old
                    return old.map((s) => {
                        if (s.id !== vars.id) return s
                        const next: PrayerSession = { ...s, ...vars.changes }
                        const start =
                            (next.start_timestamp as unknown as string) || ''
                        const end =
                            (next.end_timestamp as unknown as string) || ''
                        if (start && end) {
                            ;(next as any).duration_in_seconds = Math.max(
                                0,
                                Math.floor(
                                    (new Date(end).getTime() -
                                        new Date(start).getTime()) /
                                        1000
                                )
                            )
                        } else if (!end) {
                            ;(next as any).duration_in_seconds = null
                        }
                        return next
                    })
                }
            )

            // Also optimistically update Activity's infinite list ("session-log") pages in-place
            queryClient.setQueriesData<InfiniteData<JoinedSession[], number>>(
                { queryKey: ['session-log'] },
                (old) => {
                    if (!old) return old
                    return {
                        pageParams: old.pageParams,
                        pages: old.pages.map((page) =>
                            page.map((row) => {
                                if (row.id !== vars.id) return row
                                const next: JoinedSession = {
                                    ...(row as any),
                                    ...vars.changes,
                                }
                                const start =
                                    (next.start_timestamp as unknown as string) ||
                                    ''
                                const end =
                                    (next.end_timestamp as unknown as string) ||
                                    ''
                                if (start && end) {
                                    ;(next as any).duration_in_seconds =
                                        Math.max(
                                            0,
                                            Math.floor(
                                                (new Date(end).getTime() -
                                                    new Date(start).getTime()) /
                                                    1000
                                            )
                                        )
                                } else if (!end) {
                                    ;(next as any).duration_in_seconds = null
                                }
                                return next
                            })
                        ),
                    }
                }
            )
            return { previous } as { previous: [unknown, unknown][] }
        },
        onSuccess: (data, vars, ctx) => {
            queryClient.invalidateQueries({ queryKey: ['prayer-sessions'] })
            options?.onSuccess?.(data, vars, ctx)
        },
        onError: (err, vars, ctx) => {
            if (!options?.onError && ctx && (ctx as any).previous) {
                for (const [key, data] of (
                    ctx as { previous: [unknown, unknown][] }
                ).previous) {
                    queryClient.setQueryData(key as any, data)
                }
            }
            options?.onError?.(err, vars, ctx)
        },
        onSettled: (data, err, vars, ctx) => {
            options?.onSettled?.(data, err, vars, ctx)
        },
    })
}
