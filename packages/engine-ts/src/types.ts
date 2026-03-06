export type FlagState = Record<string, boolean>
export type ResourceState = Record<string, number>
export type VariableState = Record<string, string>

export type Condition =
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'resource'; key: string; op: '>=' | '<=' | '>' | '<' | '=='; value: number }
  | { type: 'variable'; key: string; op: '==' | '!=' | 'contains' | '!contains'; value: string }
  | { type: 'timeWindow'; start: number; end: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition }

export type Effect =
  | { type: 'setFlag'; key: string; value: boolean }
  | { type: 'addResource'; key: string; delta: number }
  | { type: 'setVariable'; key: string; value: string }
  | { type: 'goto'; target: string }

export interface ChoiceOutcome {
  type: string
  value?: string
}

export interface Choice {
  id: string
  text: string
  target: string
  conditions?: Condition[]
  effects?: Effect[]
  outcome?: ChoiceOutcome | null
}

export interface NodeDef {
  id: string
  text?: string
  choices?: Choice[]
}

export interface Model {
  modelType: string
  startNode: string
  flags?: FlagState
  resources?: ResourceState
  nodes: Record<string, NodeDef>
}

export interface SessionState {
  nodeId: string
  flags: FlagState
  resources: ResourceState
  variables: VariableState
  time: number
}
