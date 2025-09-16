import {
    useMutation,
    useQueryClient,
    type UseMutationOptions,
    type UseMutationResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesInsert } from '~/types/database.types'

type PrayerSession = Tables<'prayer_sessions'>

export type CreatePrayerSessionInput = {
    member_id: NonNullable<PrayerSession['member_id']>
    prayer_campaign_id: NonNullable<PrayerSession['prayer_campaign_id']>
    start_timestamp?: PrayerSession['start_timestamp']
}

export function useCreatePrayerSession(
    options?: UseMutationOptions<PrayerSession, Error, CreatePrayerSessionInput>
): UseMutationResult<PrayerSession, Error, CreatePrayerSessionInput> {
    const queryClient = useQueryClient()

    return useMutation<PrayerSession, Error, CreatePrayerSessionInput>({
        mutationFn: async (input) => {
            const supabase = getSupabaseBrowserClient()
            const payload: TablesInsert<'prayer_sessions'> = {
                member_id: input.member_id,
                prayer_campaign_id: input.prayer_campaign_id,
                start_timestamp:
                    input.start_timestamp ?? new Date().toISOString(),
                end_timestamp: null,
            }
            const { data, error } = await supabase
                .from('prayer_sessions')
                .insert(payload)
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
