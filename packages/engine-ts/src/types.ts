export type FlagState = Record<string, boolean>
export type ResourceState = Record<string, number>
export type VariableState = Record<string, string | number>

export interface PropertyDef {
  key: string
  type: 'string' | 'number' | 'boolean'
  defaultValue?: string | number | boolean
  rangeMin?: number
  rangeMax?: number
  labels?: string[]
}

export interface EntityDef {
  id: string
  name: string
  description?: string
  cost?: number
  parentEntity?: string
  properties?: Record<string, PropertyDef>
}

export type Condition =
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'resource'; key: string; op: '>=' | '<=' | '>' | '<' | '=='; value: number }
  | { type: 'variable'; key: string; op: '==' | '!=' | 'contains' | '!contains' | '>=' | '<=' | '>' | '<'; value: string | number }
  | { type: 'hasItem'; key: string; value: boolean }
  | { type: 'property'; entity: string; key: string; op: '>=' | '<=' | '>' | '<' | '==' | '!='; value: string | number | boolean }
  | { type: 'hasEvent'; key: string; value: boolean }
  | { type: 'timeWindow'; start: number; end: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition }

export type Effect =
  | { type: 'setFlag'; key: string; value: boolean }
  | { type: 'addResource'; key: string; delta: number }
  | { type: 'setVariable'; key: string; value: string | number }
  | { type: 'modifyVariable'; key: string; op: '+' | '-' | '*' | '/'; value: number }
  | { type: 'addItem'; key: string }
  | { type: 'removeItem'; key: string }
  | { type: 'goto'; target: string }
  | { type: 'createEvent'; id: string; name: string; properties?: Record<string, { defaultValue: string | number | boolean }> }

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
  variables?: VariableState
  entities?: Record<string, EntityDef>
  nodes: Record<string, NodeDef>
  conversationTemplates?: import('./conversation-templates.js').ConversationTemplate[]
}

export interface SessionState {
  nodeId: string
  flags: FlagState
  resources: ResourceState
  variables: VariableState
  inventory: string[]
  time: number
  events: Record<string, EntityDef>
}
