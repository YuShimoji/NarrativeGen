const UNPROVISIONED_KEYS = ['d1', 'r2']
const PROVISIONED_KEYS = ['d1', 'project_id', 'r2']
const PROJECT_ID_PATTERN = /^appgprj_[a-f0-9]{32}$/

export function validateHostingManifest(hosting) {
  if (hosting === null || typeof hosting !== 'object' || Array.isArray(hosting)) {
    throw new Error('Hosting manifest must be a JSON object')
  }

  const keys = Object.keys(hosting).sort()
  const serializedKeys = JSON.stringify(keys)
  const isUnprovisioned = serializedKeys === JSON.stringify(UNPROVISIONED_KEYS)
  const isProvisioned = serializedKeys === JSON.stringify(PROVISIONED_KEYS)

  if ((!isUnprovisioned && !isProvisioned) || hosting.d1 !== null || hosting.r2 !== null) {
    throw new Error(
      'Hosting manifest must contain only optional project_id plus null d1 and r2 bindings',
    )
  }

  if (isProvisioned && !PROJECT_ID_PATTERN.test(hosting.project_id)) {
    throw new Error('Provisioned hosting manifest contains an invalid project_id')
  }

  return {
    d1: hosting.d1,
    r2: hosting.r2,
    projectIdPresent: isProvisioned,
  }
}
