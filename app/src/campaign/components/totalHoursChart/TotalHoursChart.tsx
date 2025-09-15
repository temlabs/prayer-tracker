import type { Tables } from '~/types/database.types'
import type { HoursPoint } from '~/src/campaign/useTotalHoursPrayedTimeSeries'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
    LineChart,
    Legend,
} from 'recharts'
import { useMemo } from 'react'

type Campaign = Tables<'prayer_campaigns'>

export type TotalHoursChartProps = {
    campaign: Campaign
    campaignTimeSeries: HoursPoint[]
}

export function TotalHoursChart({
    campaign,
    campaignTimeSeries,
}: TotalHoursChartProps) {
    const isDark = useMemo(() => {
        if (typeof window === 'undefined') return false
        const prefers = window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches
        const hasClass = document.documentElement.classList.contains('dark')
        return prefers || hasClass
    }, [])
    const target = campaign.target_hours ?? null
    const latest =
        campaignTimeSeries.length > 0
            ? campaignTimeSeries[campaignTimeSeries.length - 1]
            : null
    const yMax = useMemo(() => {
        const latestVal = latest?.hours ?? 0
        const targetVal = target ?? 0
        const max = Math.max(latestVal, targetVal)
        return max > 0 ? Math.ceil(max * 1.05) : 10
    }, [latest, target])

    const xTicks = useMemo(() => {
        const dates = campaignTimeSeries.map((p) => p.day)
        if (dates.length === 0) return []
        const first = dates[0]
        const tickSet = new Set<string>([first])
        const many = dates.length > 90
        for (const d of dates) {
            const dt = new Date(d)
            if (many) {
                if (dt.getDate() === 1) tickSet.add(d)
            } else {
                if (dt.getDay() === 1) tickSet.add(d) // Mondays
            }
        }
        return Array.from(tickSet)
    }, [campaignTimeSeries])

    // console.debug('xTicks', xTicks)

    return (
        <section className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
            <div className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Cumulative hours over time
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={campaignTimeSeries}>
                    {/* <CartesianGrid stroke="#eee" strokeDasharray="5 5" /> */}
                    <XAxis
                        dataKey="endOfDayIso"
                        tick={{
                            fill: isDark ? '#cbd5e1' : '#4b5563',
                            fontSize: 12,
                        }}
                        axisLine={{ stroke: isDark ? '#475569' : '#e5e7eb' }}
                        tickLine={{ stroke: isDark ? '#475569' : '#e5e7eb' }}
                        tickFormatter={(d) => {
                            const dateD = new Date(d)
                            return `${dateD.getDate()}/${(dateD.getMonth() + 1).toString().length < 2 ? '0' : ''}${dateD.getMonth() + 1}`
                        }}
                    />
                    <YAxis
                        tick={{
                            fill: isDark ? '#cbd5e1' : '#4b5563',
                            fontSize: 12,
                        }}
                        axisLine={{ stroke: isDark ? '#475569' : '#e5e7eb' }}
                        tickLine={{ stroke: isDark ? '#475569' : '#e5e7eb' }}
                        // domain={[0, 1000]}
                    />
                    {/* <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={false}
                        name="hours prayed"
                    /> */}
                    <Area
                        dataKey="hours"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="hours prayed"
                    />
                    <Line
                        type="monotone"
                        dataKey="guide"
                        stroke="#9ab5a1"
                        opacity={0.4}
                        strokeWidth={2}
                        dot={false}
                        name="target line"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#111827' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#e5e7eb',
                            color: isDark ? '#e5e7eb' : '#111827',
                        }}
                        labelStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
                        itemStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
                    />
                    <Legend
                        align="right"
                        wrapperStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            {/* <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                    data={campaignTimeSeries}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                    <defs>
                        <linearGradient
                            id="hoursGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#2563eb"
                                stopOpacity={0.4}
                            />
                            <stop
                                offset="100%"
                                stopColor="#2563eb"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="day"
                        ticks={campaignTimeSeries.map((p) => p.endOfDayIso)}
                        tickFormatter={(d) => {
                            console.debug('about to format', d)
                            const dt = new Date(d)
                            const opts: Intl.DateTimeFormatOptions = {
                                day: 'numeric',
                                month: 'short',
                            }
                            const formatted = dt.toLocaleDateString(
                                undefined,
                                opts
                            )
                            console.debug('formatted', formatted)
                            return formatted
                        }}
                        interval={0}
                        minTickGap={20}
                    />
                    <YAxis
                        domain={[0, yMax]}
                        ticks={
                            Array.from(
                                new Set(
                                    [
                                        latest?.hours ?? 0,
                                        target ?? undefined,
                                    ].filter((v) => typeof v === 'number')
                                )
                            ) as number[]
                        }
                        tickFormatter={(v) => `${Math.round(v)}`}
                    />
                    <Tooltip
                        formatter={(value: any) => [
                            `${Number(value).toFixed(value < 10 ? 1 : 0)} h`,
                            'Hours',
                        ]}
                        labelFormatter={(label) => {
                            const dt = new Date(label)
                            return dt.toLocaleDateString()
                        }}
                    />
                    {target != null ? (
                        <ReferenceLine
                            y={target}
                            stroke="#94a3b8"
                            strokeDasharray="4 4"
                            label={{
                                value: 'Target',
                                position: 'right',
                                fill: '#64748b',
                                fontSize: 10,
                            }}
                        />
                    ) : null}

                    {campaign.start_timestamp &&
                    campaign.end_timestamp &&
                    target != null ? (
                        <Line
                            type="monotone"
                            data={[
                                {
                                    x: campaign.start_timestamp.slice(0, 10),
                                    y: 0,
                                },
                                {
                                    x: campaign.end_timestamp.slice(0, 10),
                                    y: target,
                                },
                            ]}
                            dataKey="y"
                            xAxisId={0 as any}
                            dot={false}
                            stroke="#0ea5e9"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                        />
                    ) : null}

                    <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="#2563eb"
                        fill="url(#hoursGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer> */}
        </section>
    )
}
