import type { Route } from './+types/log'

export const meta: Route.MetaFunction = () => [{ title: 'Log Prayer' }]

export default function Log() {
    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Log Prayer</h1>
                <p className="text-neutral-600">
                    This screen will let you start/end or edit sessions.
                </p>
            </div>
        </main>
    )
}
