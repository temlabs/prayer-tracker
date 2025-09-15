import type { Route } from './+types/home'
import { Welcome } from '../welcome/welcome'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'New React Router App' },
        { name: 'description', content: 'Welcome to React Router!' },
    ]
}

export default function Home() {
    const navigate = useNavigate()
    useEffect(() => {
        try {
            const raw =
                typeof window !== 'undefined'
                    ? localStorage.getItem('pt.user')
                    : null
            if (!raw) navigate('/identity', { replace: true })
        } catch {
            // ignore
        }
    }, [navigate])
    return <Welcome />
}
