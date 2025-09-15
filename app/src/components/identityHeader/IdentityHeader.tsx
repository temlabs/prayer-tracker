import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>

export type IdentityHeaderProps = {
    member: Member
    onChangeMember: () => void
    campaignName?: string
}

export function IdentityHeader({
    member,
    onChangeMember,
    campaignName,
}: IdentityHeaderProps) {
    return (
        <header className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
            <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Welcome,
                </p>
                <h2 className="text-lg font-semibold leading-tight">
                    {member.first_name}!
                </h2>
                {campaignName ? (
                    <p className="text-xs text-neutral-600 mt-1 dark:text-neutral-400">
                        You are viewing and logging time against the{' '}
                        {campaignName} campaign.
                    </p>
                ) : null}
            </div>
            <button
                type="button"
                onClick={onChangeMember}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
                Change
            </button>
        </header>
    )
}
