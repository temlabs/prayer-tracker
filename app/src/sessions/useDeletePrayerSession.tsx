import {
    useMutation,
    useQueryClient,
    type UseMutationOptions,
    type UseMutationResult,
    type InfiniteData,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'
import type { JoinedSession } from '~/src/sessions/useInfiniteSessionLog'

type PrayerSession = Tables<'prayer_sessions'>

export type DeletePrayerSessionInput = { id: PrayerSession['id'] }

type Ctx = {
    previousLists: [unknown, unknown][]
    previousLog: [unknown, unknown][]
}

export function useDeletePrayerSession(
    options?: UseMutationOptions<PrayerSession, Error, DeletePrayerSessionInput>
): UseMutationResult<PrayerSession, Error, DeletePrayerSessionInput> {
    const queryClient = useQueryClient()

    return useMutation<PrayerSession, Error, DeletePrayerSessionInput>({
        mutationFn: async ({ id }) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('prayer_sessions')
                .delete()
                .eq('id', id)
                .select('*')
                .single()
            if (error) throw error
            return data as PrayerSession
        },
        onMutate: async (vars) => {
            await queryClient.cancelQueries({ queryKey: ['prayer-sessions'] })
            await queryClient.cancelQueries({ queryKey: ['session-log'] })

            if (options?.onMutate) {
                return (
                    options.onMutate as unknown as (
                        v: DeletePrayerSessionInput
                    ) => unknown
                )(vars)
            }

            const previousLists = queryClient.getQueriesData({
                queryKey: ['prayer-sessions'],
            })
            const previousLog = queryClient.getQueriesData({
                queryKey: ['session-log'],
            })

            // Remove from any cached flat lists (including active/recent variants)
            queryClient.setQueriesData<PrayerSession[]>(
                { queryKey: ['prayer-sessions'] },
                (old) => (old ? old.filter((s) => s.id !== vars.id) : old)
            )

            // Remove from the activity infinite list pages
            queryClient.setQueriesData<InfiniteData<JoinedSession[], number>>(
                { queryKey: ['session-log'] },
                (old) => {
                    if (!old) return old
                    return {
                        pageParams: old.pageParams,
                        pages: old.pages.map((page) =>
                            page.filter((row) => row.id !== vars.id)
                        ),
                    }
                }
            )

            return { previousLists, previousLog } as Ctx
        },
        onSuccess: (data, vars, ctx) => {
            queryClient.invalidateQueries({ queryKey: ['prayer-sessions'] })
            queryClient.invalidateQueries({ queryKey: ['session-log'] })
            queryClient.invalidateQueries({ queryKey: ['prayer-campaigns'] })
            options?.onSuccess?.(data, vars, ctx)
        },
        onError: (err, vars, ctx) => {
            if (!options?.onError && ctx) {
                const { previousLists, previousLog } = ctx as Ctx
                for (const [key, data] of previousLists) {
                    queryClient.setQueryData(key as any, data)
                }
                for (const [key, data] of previousLog) {
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
