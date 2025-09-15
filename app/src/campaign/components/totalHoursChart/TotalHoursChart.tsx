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

    console.debug('campaignTimeSeries', campaignTimeSeries)

    return (
        <section className="rounded-md border border-neutral-200 bg-white p-3">
            <div className="mb-2 text-xs font-medium text-neutral-600">
                Cumulative hours over time
            </div>
            <ResponsiveContainer width="100%" height={220}>
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
                        ticks={xTicks}
                        tickFormatter={(d) => {
                            const dt = new Date(d)
                            const opts: Intl.DateTimeFormatOptions = {
                                day: 'numeric',
                                month: 'short',
                            }
                            return dt.toLocaleDateString(undefined, opts)
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
            </ResponsiveContainer>
        </section>
    )
}
