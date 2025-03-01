import React, { Suspense } from 'react'

import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'
import { Container } from 'decentraland-ui/dist/components/Container/Container'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'
import { NotMobile, useMobileMediaQuery } from 'decentraland-ui/dist/components/Media/Media'

import { VpDistribution } from '../../clients/SnapshotTypes'
import { isSameAddress } from '../../entities/Snapshot/utils'
import useFormatMessage from '../../hooks/useFormatMessage'
import useGovernanceProfile from '../../hooks/useGovernanceProfile'
import Username from '../Common/Username'
import VotingPowerDistribution from '../Modal/VotingPowerDelegationDetail/VotingPowerDistribution'
import { ProfileBox } from '../Profile/ProfileBox'
import ProfileSettings from '../Profile/ProfileSettings'

import Badges from './Badges/Badges'

import './UserStats.css'
import UserVotingStats from './UserVotingStats'
import UserVpStats from './UserVpStats'
import ValidatedProfileCheck from './ValidatedProfileCheck'

interface Props {
  address: string
  vpDistribution: VpDistribution | null
  isLoadingVpDistribution: boolean
}

const UserAvatar = React.lazy(() => import('./UserAvatar'))

export default function UserStats({ address, vpDistribution, isLoadingVpDistribution }: Props) {
  const t = useFormatMessage()
  const isMobile = useMobileMediaQuery()
  const { profile, isLoadingGovernanceProfile, isProfileValidated } = useGovernanceProfile(address)
  const [user] = useAuthContext()
  const showSettings = isSameAddress(user, address) && !isLoadingGovernanceProfile && !isProfileValidated
  const { total } = vpDistribution || { total: 0 }

  return (
    <Container fluid className="UserStats__Container">
      <div className="UserStats__UserInfo">
        <div className="UserStats__UsernameContainer">
          <Username address={address} size={isMobile ? 'small' : 'medium'} className="UserStats__Username" />
          <ValidatedProfileCheck forumUsername={profile?.forum_username} isLoading={isLoadingGovernanceProfile} />
          {showSettings && <ProfileSettings />}
        </div>
        <Badges address={address} />
        <UserVpStats vpDistribution={vpDistribution} isLoadingVpDistribution={isLoadingVpDistribution} />
        {total > 0 && (
          <ProfileBox title={t('page.profile.user_vp_stats.vp_distribution')} className="UserStats__VpDistributionBox">
            <VotingPowerDistribution
              vpDistribution={vpDistribution}
              isLoading={isLoadingVpDistribution}
              className="UserStats__VpDistribution"
            />
          </ProfileBox>
        )}
        <UserVotingStats address={address} />
      </div>
      <NotMobile>
        <Suspense fallback={<Loader active={true} size="small" />}>
          <UserAvatar address={address} />
        </Suspense>
      </NotMobile>
    </Container>
  )
}
