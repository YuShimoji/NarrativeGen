export type FlagState = Record<string, boolean>
export type ResourceState = Record<string, number>

export type Condition =
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'resource'; key: string; op: '>=' | '<=' | '>' | '<' | '=='; value: number }
  | { type: 'timeWindow'; start: number; end: number }

export type Effect =
  | { type: 'setFlag'; key: string; value: boolean }
  | { type: 'addResource'; key: string; delta: number }
  | { type: 'goto'; target: string }

export interface Choice {
  id: string
  text: string
  target: string
  conditions?: Condition[]
  effects?: Effect[]
  outcome?: { type: string; value: string }
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
  time: number
}
