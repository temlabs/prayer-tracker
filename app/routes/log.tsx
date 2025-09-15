import type { Route } from './+types/log'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { IdentityHeader } from '~/src/components/identityHeader/IdentityHeader'

import { useFetchCurrentMember } from '~/src/member/useFetchCurrentMember'
import { useFetchPrayerSessions } from '~/src/sessions/useFetchPrayerSessions'
import { HeroButton } from '~/src/components/heroButton/HeroButton'
import { LinkButton } from '~/src/components/linkButton/LinkButton'
import { ActiveSession } from '~/src/sessions/components/activeSession/ActiveSession'
import { useFetchMemberCampaigns } from '~/src/campaign/useFetchMemberCampaigns'
import { NoCampaignPlaceholder } from '~/src/components/placeholder/NoCampaignPlaceholder'
import { useCreatePrayerSession } from '~/src/sessions/useCreatePrayerSession'

export const meta: Route.MetaFunction = () => [{ title: 'Log Prayer' }]

export default function Log() {
    const navigate = useNavigate()
    const member = useFetchCurrentMember()
    const { data: activePrayerSessions } = useFetchPrayerSessions({
        equals: { end_timestamp: null },
    })
    const nowIso = useMemo(() => new Date().toISOString(), [])
    const memberCampaignArgs = useMemo(
        () =>
            member
                ? {
                      member_id: member.id,
                      filters: {
                          gte: { end_timestamp: nowIso },
                          orderBy: { column: 'end_timestamp', ascending: true },
                      },
                  }
                : null,
        [member, nowIso]
    )
    const { data: memberCampaigns } = useFetchMemberCampaigns(
        memberCampaignArgs ?? ({ member_id: '' } as any),
        { enabled: !!memberCampaignArgs }
    )
    const defaultCampaign = memberCampaigns?.[0]?.campaign
    const currentCampaignName = defaultCampaign?.name

    function handleChangeMember() {
        try {
            localStorage.removeItem('pt.user')
        } catch {}
        navigate('/identity')
    }

    const { mutate: createSession } = useCreatePrayerSession()
    function handleStartPraying() {
        if (!member || !defaultCampaign) return
        createSession({
            member_id: member.id,
            prayer_campaign_id: defaultCampaign.id,
        })
    }

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Log Prayer</h1>
                {member ? (
                    <div className="mt-4">
                        <IdentityHeader
                            member={member}
                            campaignName={currentCampaignName}
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

                {memberCampaigns && memberCampaigns.length === 0 ? (
                    <section className="mt-8">
                        <NoCampaignPlaceholder />
                    </section>
                ) : (
                    <section className="mt-8 space-y-3">
                        {activePrayerSessions &&
                        activePrayerSessions.length > 0 ? (
                            activePrayerSessions.map((s) => (
                                <ActiveSession key={s.id} session={s} />
                            ))
                        ) : (
                            <div className="space-y-3">
                                <HeroButton
                                    text="Start praying now"
                                    onPress={handleStartPraying}
                                />
                                <div className="text-center">
                                    <LinkButton text="Log a past prayer" />
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    )
}
