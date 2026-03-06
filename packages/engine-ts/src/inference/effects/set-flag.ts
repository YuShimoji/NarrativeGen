import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'

interface SetFlagEffect {
  type: 'setFlag'
  key: string
  value: boolean
}

export const setFlagApplicator: EffectApplicator<SetFlagEffect> = {
  type: 'setFlag',

  apply(effect: SetFlagEffect, session: SessionState): SessionState {
    return { ...session, flags: { ...session.flags, [effect.key]: effect.value } }
  },

  getAffectedKeys(effect: SetFlagEffect): DependencyInfo {
    return { flags: [effect.key] }
  },
}
