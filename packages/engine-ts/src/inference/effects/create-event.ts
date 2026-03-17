import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'
import { createEventEntity } from '../../event-entity.js'
import type { CreateEventEffect } from '../../event-entity.js'

export const createEventApplicator: EffectApplicator<CreateEventEffect> = {
  type: 'createEvent',

  apply(effect: CreateEventEffect, session: SessionState): SessionState {
    return createEventEntity(effect, session)
  },

  getAffectedKeys(): DependencyInfo {
    return {}
  },
}
