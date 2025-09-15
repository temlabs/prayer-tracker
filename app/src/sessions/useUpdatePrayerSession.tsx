import {
    useMutation,
    useQueryClient,
    type UseMutationOptions,
    type UseMutationResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesUpdate } from '~/types/database.types'

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
        onSuccess: (data, vars, ctx) => {
            queryClient.invalidateQueries({ queryKey: ['prayer-sessions'] })
            options?.onSuccess?.(data, vars, ctx)
        },
        onError: (err, vars, ctx) => {
            options?.onError?.(err, vars, ctx)
        },
        onSettled: (data, err, vars, ctx) => {
            options?.onSettled?.(data, err, vars, ctx)
        },
    })
}
