import type { Route } from './+types/log'
import { useNavigate } from 'react-router'
import { IdentityHeader } from '~/src/components/identityHeader/identityHeader'

import { useFetchCurrentMember } from '~/src/member/useFetchCurrentMember'

export const meta: Route.MetaFunction = () => [{ title: 'Log Prayer' }]

export default function Log() {
    const navigate = useNavigate()
    const member = useFetchCurrentMember()

    function handleChangeMember() {
        try {
            localStorage.removeItem('pt.user')
        } catch {}
        navigate('/identity')
    }
    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Log Prayer</h1>
                {member ? (
                    <div className="mt-4">
                        <IdentityHeader
                            member={member}
                            onChangeMember={handleChangeMember}
                        />
                    </div>
                ) : (
                    <div className="mt-4 rounded-md border border-neutral-200 p-4 text-sm text-neutral-700">
                        No member selected.{' '}
                        <button
                            type="button"
                            className="underline"
                            onClick={() => navigate('/identity')}
                        >
                            Choose your identity
                        </button>
                    </div>
                )}
                <p className="text-neutral-600">
                    This screen will let you start/end or edit sessions.
                </p>
            </div>
        </main>
    )
}
