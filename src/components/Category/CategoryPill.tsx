import React from 'react'

import classNames from 'classnames'
import { useMobileMediaQuery } from 'decentraland-ui/dist/components/Media/Media'

import { ProposalType } from '../../entities/Proposal/types'
import locations from '../../utils/locations'
import Pill, { PillColor } from '../Common/Pill'
import Link from '../Common/Typography/Link'

const ColorsConfig: Record<ProposalType, PillColor> = {
  [ProposalType.POI]: PillColor.Green,
  [ProposalType.Catalyst]: PillColor.Blue,
  [ProposalType.BanName]: PillColor.Fuchsia,
  [ProposalType.Grant]: PillColor.Purple,
  [ProposalType.LinkedWearables]: PillColor.Yellow,
  [ProposalType.Poll]: PillColor.Orange,
  [ProposalType.Draft]: PillColor.Orange,
  [ProposalType.Governance]: PillColor.Orange,
  [ProposalType.Pitch]: PillColor.Red,
  [ProposalType.Tender]: PillColor.Red,
  [ProposalType.Hiring]: PillColor.Aqua,
}

type Props = {
  className?: string
  proposalType: ProposalType
  size?: 'small' | 'default'
  isLink?: boolean
}

function getProposalTypeShortLabel(proposalType: ProposalType) {
  return proposalType === ProposalType.LinkedWearables ? 'LWearables' : getProposalTypeLabel(proposalType)
}

function getProposalTypeLabel(proposalType: ProposalType) {
  return proposalType.replaceAll('_', ' ')
}

export default function CategoryPill({ className, proposalType, size = 'default', isLink = false }: Props) {
  const isMobile = useMobileMediaQuery()
  const label = isMobile ? getProposalTypeShortLabel(proposalType) : getProposalTypeLabel(proposalType)
  const colorsConfig = ColorsConfig[proposalType]
  const pillClassNames = classNames('CategoryPill', className)
  const href = isLink ? locations.proposals({ type: proposalType }) : undefined
  const pillSize = isMobile ? 'small' : size

  const component = (
    <Pill style="light" color={colorsConfig} className={pillClassNames} size={pillSize}>
      {label}
    </Pill>
  )

  if (isLink) {
    return <Link href={href}>{component}</Link>
  }

  return component
}
