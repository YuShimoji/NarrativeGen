import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'

interface AddResourceEffect {
  type: 'addResource'
  key: string
  delta: number
}

export const addResourceApplicator: EffectApplicator<AddResourceEffect> = {
  type: 'addResource',

  apply(effect: AddResourceEffect, session: SessionState): SessionState {
    const cur = session.resources[effect.key] ?? 0
    return { ...session, resources: { ...session.resources, [effect.key]: cur + effect.delta } }
  },

  getAffectedKeys(effect: AddResourceEffect): DependencyInfo {
    return { resources: [effect.key] }
  },
}
