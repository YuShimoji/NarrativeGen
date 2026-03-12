import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'

interface AddItemEffect {
  type: 'addItem'
  key: string
}

export const addItemApplicator: EffectApplicator<AddItemEffect> = {
  type: 'addItem',

  apply(effect: AddItemEffect, session: SessionState): SessionState {
    const inv = session.inventory ?? []
    if (inv.some(id => id.toLowerCase() === effect.key.toLowerCase())) {
      return session
    }
    return { ...session, inventory: [...inv, effect.key] }
  },

  getAffectedKeys(): DependencyInfo {
    return {}
  },
}
