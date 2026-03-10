import type { SessionState } from '../../types.js'
import type { EffectApplicator } from '../types.js'

interface GotoEffect {
  type: 'goto'
  target: string
}

export const gotoApplicator: EffectApplicator<GotoEffect> = {
  type: 'goto',

  apply(effect: GotoEffect, session: SessionState): SessionState {
    return { ...session, nodeId: effect.target }
  },
}
