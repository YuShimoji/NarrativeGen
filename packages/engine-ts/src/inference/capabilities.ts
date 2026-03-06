/**
 * Capability Discovery - Expose registered evaluators and applicators
 *
 * Allows web-tester and other consumers to dynamically discover
 * which condition types and effect types are supported,
 * enabling dynamic UI generation instead of hardcoded forms.
 */
import { registry } from './registry.js'

/**
 * Get the list of registered condition type names.
 * After registerBuiltins(), this returns: flag, resource, variable, timeWindow, and, or, not
 */
export function getSupportedConditions(): string[] {
  return registry.getRegisteredConditionTypes()
}

/**
 * Get the list of registered effect type names.
 * After registerBuiltins(), this returns: setFlag, addResource, setVariable, goto
 */
export function getSupportedEffects(): string[] {
  return registry.getRegisteredEffectTypes()
}
