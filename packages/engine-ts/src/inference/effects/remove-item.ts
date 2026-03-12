import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'

interface RemoveItemEffect {
  type: 'removeItem'
  key: string
}

export const removeItemApplicator: EffectApplicator<RemoveItemEffect> = {
  type: 'removeItem',

  apply(effect: RemoveItemEffect, session: SessionState): SessionState {
    const inv = session.inventory ?? []
    const idx = inv.findIndex(id => id.toLowerCase() === effect.key.toLowerCase())
    if (idx === -1) return session
    const next = [...inv]
    next.splice(idx, 1)
    return { ...session, inventory: next }
  },

  getAffectedKeys(): DependencyInfo {
    return {}
  },
}
