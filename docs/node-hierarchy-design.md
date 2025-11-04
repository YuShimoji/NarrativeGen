// Node Hierarchy System Design Proposal
// ノードを階層構造で管理できるようにする

/**
 * ノードグループ（フォルダ）定義
 * ノードを論理的にグループ化し、管理しやすくする
 */
export interface NodeGroup {
  /** グループID（グループ内でユニーク） */
  id: string
  /** 表示名 */
  name: string
  /** 説明 */
  description?: string
  /** このグループに属するノード */
  nodes: Record<string, Node>
  /** サブグループ（入れ子構造） */
  subgroups?: Record<string, NodeGroup>
  /** メタデータ（UI表示用など） */
  metadata?: Record<string, any>
}

/**
 * 階層構造を持つモデル
 */
export interface HierarchicalModel extends Omit<Model, 'nodes'> {
  /** ノードグループのマップ */
  nodeGroups: Record<string, NodeGroup>
  /** ルートグループID */
  rootGroup: string
}

/**
 * 完全なノードIDを解決するユーティリティ
 * @param model 階層モデル
 * @param localId ローカルノードID
 * @param groupPath 検索対象のグループパス（オプション）
 * @returns 完全なノードID（group.subgroup.nodeId の形式）
 */
export function resolveNodeId(
  model: HierarchicalModel,
  localId: string,
  groupPath?: string[]
): string {
  // groupPathが指定されていない場合は、rootGroupから検索
  const searchPath = groupPath || [model.rootGroup]

  for (const groupId of searchPath) {
    const group = model.nodeGroups[groupId]
    if (group?.nodes[localId]) {
      return `${groupId}.${localId}`
    }
    // サブグループも検索
    if (group?.subgroups) {
      for (const [subId, subgroup] of Object.entries(group.subgroups)) {
        if (subgroup.nodes[localId]) {
          return `${groupId}.${subId}.${localId}`
        }
      }
    }
  }

  return localId // フォールバック（後方互換性）
}

/**
 * CSVフォーマット拡張案
 *
 * 現在の列:
 * node_id, node_text, choice_id, choice_text, choice_target, ...
 *
 * 新しい列:
 * node_group - ノードが属するグループパス（例: "chapters/intro", "chapters/main_quest/battlefield"）
 *
 * 利点:
 * - ノードIDをグループ内でユニークにするだけで良い
 * - 大規模物語の構造化が容易
 * - UIでのフォルダ表示が可能
 *
 * 例:
 * node_group,node_id,node_text,choice_id,choice_text,choice_target
 * chapters/intro,start,ようこそ...,learn,基本機能を学ぶ,intro/tutorial
 * chapters/tutorial,tutorial,チュートリアル...,back,戻る,start
 */
