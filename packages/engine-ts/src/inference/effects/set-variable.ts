import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'

interface SetVariableEffect {
  type: 'setVariable'
  key: string
  value: string
}

export const setVariableApplicator: EffectApplicator<SetVariableEffect> = {
  type: 'setVariable',

  apply(effect: SetVariableEffect, session: SessionState): SessionState {
    return { ...session, variables: { ...session.variables, [effect.key]: effect.value } }
  },

  getAffectedKeys(effect: SetVariableEffect): DependencyInfo {
    return { variables: [effect.key] }
  },
}
