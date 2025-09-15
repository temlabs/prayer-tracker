import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>

export type IdentityHeaderProps = {
    member: Member
    onChangeMember: () => void
}

export function IdentityHeader({
    member,
    onChangeMember,
}: IdentityHeaderProps) {
    return (
        <header className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3">
            <div>
                <p className="text-sm text-neutral-600">Welcome,</p>
                <h2 className="text-lg font-semibold leading-tight">
                    {member.first_name}!
                </h2>
            </div>
            <button
                type="button"
                onClick={onChangeMember}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
                Change
            </button>
        </header>
    )
}
