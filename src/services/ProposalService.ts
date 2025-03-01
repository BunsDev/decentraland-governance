import logger from 'decentraland-gatsby/dist/entities/Development/logger'
import RequestError from 'decentraland-gatsby/dist/entities/Route/error'
import { v1 as uuid } from 'uuid'

import { VoteService } from '../back/services/vote'
import { Discourse, DiscourseComment, DiscoursePost } from '../clients/Discourse'
import { SnapshotProposalContent } from '../clients/SnapshotTypes'
import CoauthorModel from '../entities/Coauthor/model'
import isDAOCommittee from '../entities/Committee/isDAOCommittee'
import ProposalModel from '../entities/Proposal/model'
import * as templates from '../entities/Proposal/templates'
import { getUpdateMessage } from '../entities/Proposal/templates/messages'
import { ProposalAttributes, ProposalStatus, ProposalType } from '../entities/Proposal/types'
import { isGrantProposalSubmitEnabled } from '../entities/Proposal/utils'
import { SNAPSHOT_SPACE } from '../entities/Snapshot/constants'
import VotesModel from '../entities/Votes/model'
import { inBackground } from '../helpers'
import { getProfile } from '../utils/Catalyst'
import Time from '../utils/date/Time'
import { getEnvironmentChainId } from '../utils/votes/utils'

import { DiscordService } from './DiscordService'
import { DiscourseService } from './DiscourseService'
import { SnapshotService } from './SnapshotService'

export type ProposalInCreation = {
  type: ProposalAttributes['type']
  user: ProposalAttributes['user']
  configuration: ProposalAttributes['configuration']
  required_to_pass: ProposalAttributes['required_to_pass']
  finish_at: ProposalAttributes['finish_at']
  start_at?: ProposalAttributes['start_at']
}

export type ProposalLifespan = {
  created: Date
  start: Date
  end: Date
}

export class ProposalService {
  static async createProposal(proposalInCreation: ProposalInCreation) {
    if (proposalInCreation.type === ProposalType.Grant && !isGrantProposalSubmitEnabled(Date.now())) {
      throw new Error('Decentraland DAO Grants Program has been put on hold')
    }

    const proposalId = uuid()
    const proposalLifespan = this.getLifespan(proposalInCreation)
    const coAuthors = this.getCoAuthors(proposalInCreation)

    if (coAuthors) {
      delete proposalInCreation.configuration.coAuthors
    }

    const profile = await getProfile(proposalInCreation.user)

    const { snapshotId, snapshotUrl, snapshotContent } = await SnapshotService.createProposal(
      proposalInCreation,
      proposalId,
      profile,
      proposalLifespan
    )

    const discourseProposal = await DiscourseService.createProposal(
      proposalInCreation,
      proposalId,
      profile,
      snapshotUrl,
      snapshotId
    )

    const title = templates.title({ type: proposalInCreation.type, configuration: proposalInCreation.configuration })
    const description = await templates.description({
      type: proposalInCreation.type,
      configuration: proposalInCreation.configuration,
    })

    const newProposal = await ProposalService.saveToDb(
      proposalInCreation,
      proposalId,
      title,
      description,
      snapshotId,
      snapshotContent,
      discourseProposal,
      proposalLifespan,
      coAuthors
    )

    DiscordService.newProposal(
      newProposal.id,
      title,
      proposalInCreation.type,
      description,
      snapshotContent.choices,
      proposalInCreation.user
    )

    return ProposalModel.parse(newProposal)
  }

  private static getCoAuthors(proposalInCreation: ProposalInCreation) {
    return proposalInCreation.configuration && proposalInCreation.configuration.coAuthors
      ? (proposalInCreation.configuration.coAuthors as string[])
      : null
  }

  private static getLifespan(proposalInCreation: ProposalInCreation): ProposalLifespan {
    const now = Time.utc().set('seconds', 0).toDate()

    return {
      created: now,
      start: proposalInCreation.start_at || now,
      end: proposalInCreation.finish_at,
    }
  }

  private static getInitialStatus(type: ProposalType) {
    return type === ProposalType.Tender ? ProposalStatus.Pending : ProposalStatus.Active
  }

  static async removeProposal(proposal: ProposalAttributes, user: string, updated_at: Date, id: string) {
    this.validateRemoval(proposal, user)
    await this.markAsDeleted(user, updated_at, id)
    DiscourseService.dropDiscourseTopic(proposal.discourse_topic_id)
    SnapshotService.dropSnapshotProposal(proposal.snapshot_id)
    return true
  }

  private static async markAsDeleted(user: string, updated_at: Date, id: string) {
    await ProposalModel.update<ProposalAttributes>(
      {
        deleted: true,
        deleted_by: user,
        updated_at,
        status: ProposalStatus.Deleted,
      },
      { id }
    )
  }

  private static validateRemoval(proposal: ProposalAttributes, user: string) {
    const allowToRemove = proposal.user === user || isDAOCommittee(user)
    if (!allowToRemove) {
      throw new RequestError('Forbidden', RequestError.Forbidden)
    }
  }

  private static async saveToDb(
    data: ProposalInCreation,
    id: string,
    title: string,
    description: string,
    snapshotId: string,
    snapshotContent: SnapshotProposalContent,
    discourseProposal: DiscoursePost,
    proposalLifespan: ProposalLifespan,
    coAuthors: string[] | null
  ) {
    const newProposal: ProposalAttributes = {
      ...data,
      id,
      title,
      description,
      configuration: JSON.stringify(data.configuration),
      status: this.getInitialStatus(data.type),
      snapshot_id: snapshotId,
      snapshot_space: SNAPSHOT_SPACE,
      snapshot_proposal: JSON.stringify(snapshotContent),
      snapshot_network: String(Number(getEnvironmentChainId())),
      discourse_id: discourseProposal.id,
      discourse_topic_id: discourseProposal.topic_id,
      discourse_topic_slug: discourseProposal.topic_slug,
      start_at: proposalLifespan.start.toJSON() as any,
      finish_at: proposalLifespan.end.toJSON() as any,
      deleted: false,
      deleted_by: null,
      enacted: false,
      enacted_by: null,
      enacted_description: null,
      enacting_tx: null,
      vesting_addresses: [],
      passed_by: null,
      passed_description: null,
      rejected_by: null,
      rejected_description: null,
      created_at: proposalLifespan.created.toJSON() as any,
      updated_at: proposalLifespan.created.toJSON() as any,
      textsearch: ProposalModel.textsearch(title, description, data.user, []),
    }

    try {
      await ProposalModel.create(newProposal)
      await VotesModel.createEmpty(id)
      if (coAuthors) {
        await CoauthorModel.createMultiple(id, coAuthors)
      }
    } catch (err: any) {
      DiscourseService.dropDiscourseTopic(discourseProposal.topic_id)
      SnapshotService.dropSnapshotProposal(snapshotId)
      throw Error("Couldn't create proposal in DB: " + err.message, err)
    }
    return newProposal
  }

  static async getProposal(id: string) {
    const proposal = await ProposalModel.findOne<ProposalAttributes>({ id, deleted: false })
    if (!proposal) {
      throw new Error(`Proposal not found: "${id}"`)
    }

    return ProposalModel.parse(proposal)
  }

  static commentProposalUpdateInDiscourse(id: string) {
    inBackground(async () => {
      const updatedProposal: ProposalAttributes | undefined = await ProposalModel.findOne<ProposalAttributes>({ id })
      if (!updatedProposal) {
        logger.error('Invalid proposal id for discourse update', { id })
        return
      }
      const votes = await VoteService.getVotes(updatedProposal.id)
      const updateMessage = getUpdateMessage(updatedProposal, votes)
      const discourseComment: DiscourseComment = {
        topic_id: updatedProposal.discourse_topic_id,
        raw: updateMessage,
        created_at: new Date().toJSON(),
      }
      await Discourse.get().commentOnPost(discourseComment)
    })
  }
}
