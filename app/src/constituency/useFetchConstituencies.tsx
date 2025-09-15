import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Constituency = Tables<'constituencies'>

type FetchConstituenciesOptions = Omit<
    UseQueryOptions<Constituency[], Error, Constituency[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchConstituencies(
    config?: FetchConstituenciesOptions
): UseQueryResult<Constituency[], Error> {
    return useQuery<Constituency[], Error, Constituency[], QueryKey>({
        queryKey: ['constituencies'],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('constituencies')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            return data ?? []
        },
        ...config,
    })
}
