/**
 * Resolves a target node ID relative to a current group path.
 *
 * Rules:
 * - Empty target: self-loop (currentGroup + currentLocalId) -> Handled by caller or by returning null/empty
 * - Absolute target: starts with '/' (e.g., '/a/b' -> 'a/b')
 * - Local ID: no '/' and no '.' prefix (e.g., 'next' -> 'currentGroup/next')
 * - Relative-to-current: starts with './' (e.g., './next' -> 'currentGroup/next')
 * - Relative-up: starts with '../' (e.g., '../other/start' -> 'parentGroup/other/start')
 * - Group-relative (slash but no prefix): e.g., 'sub/node' from 'chapters/intro' -> 'chapters/intro/sub/node'
 */
export function resolveNodeId(target: string, currentGroup: string): string {
    if (!target) return ''

    // Absolute path
    if (target.startsWith('/')) {
        return target.slice(1)
    }

    // Relative-up path (../../path)
    if (target.startsWith('../')) {
        const parts = currentGroup ? currentGroup.split('/').filter(Boolean) : []
        let t = target
        while (t.startsWith('../')) {
            parts.pop()
            t = t.slice(3)
        }
        const resultParts = [...parts]
        if (t && t !== '.') {
            resultParts.push(...t.split('/').filter(Boolean))
        }
        return resultParts.join('/')
    }

    // Relative-to-current (./path or .)
    if (target === '.' || target.startsWith('./')) {
        if (!currentGroup) return (target === '.' ? '' : target.slice(2))
        if (target === '.' || target === './') return currentGroup
        return `${currentGroup}/${target.slice(2)}`
    }

    // Local ID (no slash)
    if (!target.includes('/')) {
        if (!currentGroup) return target
        return `${currentGroup}/${target}`
    }

    // Group-relative (contains slash but no prefix)
    // Example: current="chapters/intro", target="sub/node" -> "chapters/intro/sub/node"
    if (!currentGroup) return target
    return `${currentGroup}/${target}`
}

/**
 * Splits a canonical ID into group and local ID.
 * Example: 'chapters/intro/start' -> { group: 'chapters/intro', localId: 'start' }
 * Example: 'start' -> { group: '', localId: 'start' }
 */
export function splitCanonicalId(canonicalId: string): { group: string; localId: string } {
    if (!canonicalId.includes('/')) {
        return { group: '', localId: canonicalId }
    }
    const lastSlash = canonicalId.lastIndexOf('/')
    return {
        group: canonicalId.slice(0, lastSlash),
        localId: canonicalId.slice(lastSlash + 1)
    }
}
