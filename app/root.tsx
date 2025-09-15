import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const links: Route.LinksFunction = () => [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
    },
    {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
    },
]

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    const [queryClient] = useState(() => new QueryClient())
    const [isHydrated, setIsHydrated] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const location = useLocation()
    useEffect(() => {
        setIsHydrated(true)
    }, [])
    useEffect(() => {
        // close drawer on route change
        setDrawerOpen(false)
    }, [location])
    return (
        <QueryClientProvider client={queryClient}>
            <div className="relative min-h-[100svh]">
                <button
                    type="button"
                    aria-label="Open menu"
                    className="fixed left-3 top-3 z-40 rounded border border-neutral-300 bg-white/90 px-3 py-1.5 text-sm backdrop-blur"
                    onClick={() => setDrawerOpen(true)}
                >
                    ☰
                </button>

                {/* Side drawer */}
                {drawerOpen && (
                    <div className="fixed inset-0 z-50">
                        <div
                            className="absolute inset-0 bg-black/30"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <nav className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl pt-14">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                                <span className="text-sm font-semibold">
                                    Menu
                                </span>
                                <button
                                    className="text-sm underline"
                                    onClick={() => setDrawerOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                            <ul className="p-2">
                                <li>
                                    <Link
                                        className="block rounded px-3 py-2 hover:bg-neutral-100"
                                        to="/"
                                    >
                                        Log Prayer Time
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="block rounded px-3 py-2 hover:bg-neutral-100"
                                        to="/activity"
                                    >
                                        Activity Log
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="block rounded px-3 py-2 hover:bg-neutral-100"
                                        to="/data"
                                    >
                                        Campaign Stats
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}

                <div className="pt-14">
                    <Outlet />
                </div>
            </div>
            {import.meta.env.DEV && isHydrated ? (
                <ReactQueryDevtools initialIsOpen={false} />
            ) : null}
        </QueryClientProvider>
    )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = 'Oops!'
    let details = 'An unexpected error occurred.'
    let stack: string | undefined

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error'
        details =
            error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message
        stack = error.stack
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    )
}
