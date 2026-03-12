import type { SessionState } from '../../types.js'
import type { EffectApplicator, DependencyInfo } from '../types.js'

interface ModifyVariableEffect {
  type: 'modifyVariable'
  key: string
  op: '+' | '-' | '*' | '/'
  value: number
}

export const modifyVariableApplicator: EffectApplicator<ModifyVariableEffect> = {
  type: 'modifyVariable',

  apply(effect: ModifyVariableEffect, session: SessionState): SessionState {
    const cur = session.variables[effect.key]
    const numCur = typeof cur === 'number' ? cur : 0
    let result: number
    switch (effect.op) {
      case '+': result = numCur + effect.value; break
      case '-': result = numCur - effect.value; break
      case '*': result = numCur * effect.value; break
      case '/': result = effect.value !== 0 ? numCur / effect.value : numCur; break
      default: result = numCur
    }
    return { ...session, variables: { ...session.variables, [effect.key]: result } }
  },

  getAffectedKeys(effect: ModifyVariableEffect): DependencyInfo {
    return { variables: [effect.key] }
  },
}
