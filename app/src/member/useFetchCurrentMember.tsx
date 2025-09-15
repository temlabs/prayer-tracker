import { useEffect, useState } from 'react'
import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>

export function useFetchCurrentMember() {
    const [member, setMember] = useState<Member | null>(null)

    useEffect(() => {
        try {
            const raw = localStorage.getItem('pt.user')
            if (!raw) return
            const parsed = JSON.parse(raw) as Partial<Member> | null
            if (
                parsed &&
                typeof parsed === 'object' &&
                parsed.id &&
                parsed.first_name &&
                parsed.last_name
            ) {
                setMember(parsed as Member)
            } else if (
                parsed &&
                typeof parsed === 'object' &&
                parsed.id &&
                parsed.first_name
            ) {
                // Backward compat if only partial data was stored earlier
                setMember(parsed as Member)
            }
        } catch {}
    }, [])

    return member
}
