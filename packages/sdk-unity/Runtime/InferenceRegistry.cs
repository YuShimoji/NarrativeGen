using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    /// <summary>
    /// Context provided to condition evaluators.
    /// </summary>
    public class EvaluationContext
    {
        public Dictionary<string, bool> Flags { get; set; } = new();
        public Dictionary<string, double> Resources { get; set; } = new();
        public Dictionary<string, object> Variables { get; set; } = new();
        public List<string> Inventory { get; set; } = new();
        public double Time { get; set; }

        public static EvaluationContext FromSession(Session session)
        {
            return new EvaluationContext
            {
                Flags = session.Flags,
                Resources = session.Resources,
                Variables = session.Variables,
                Inventory = session.Inventory,
                Time = session.Time,
            };
        }
    }

    /// <summary>
    /// Evaluates a specific condition type.
    /// </summary>
    public interface IConditionEvaluator
    {
        string Type { get; }
        bool Evaluate(Condition condition, EvaluationContext context);
    }

    /// <summary>
    /// Applies a specific effect type to a session.
    /// </summary>
    public interface IEffectApplicator
    {
        string Type { get; }
        Session Apply(Effect effect, Session session);
    }

    /// <summary>
    /// Plugin registry for condition evaluators and effect applicators.
    /// Mirrors the TypeScript InferenceRegistry pattern.
    /// </summary>
    public class InferenceRegistry
    {
        private static InferenceRegistry? _instance;
        private static bool _initialized;

        private readonly Dictionary<string, IConditionEvaluator> _conditions = new();
        private readonly Dictionary<string, IEffectApplicator> _effects = new();

        public static InferenceRegistry Instance => _instance ??= new InferenceRegistry();

        public void RegisterCondition(IConditionEvaluator evaluator)
        {
            _conditions[evaluator.Type] = evaluator;
        }

        public void RegisterEffect(IEffectApplicator applicator)
        {
            _effects[applicator.Type] = applicator;
        }

        public bool EvaluateCondition(Condition condition, EvaluationContext context)
        {
            if (_conditions.TryGetValue(condition.Type, out var evaluator))
                return evaluator.Evaluate(condition, context);
            return false;
        }

        public Session ApplyEffect(Effect effect, Session session)
        {
            if (_effects.TryGetValue(effect.Type, out var applicator))
                return applicator.Apply(effect, session);
            return session;
        }

        public IReadOnlyList<string> GetSupportedConditions() => _conditions.Keys.ToList();
        public IReadOnlyList<string> GetSupportedEffects() => _effects.Keys.ToList();

        public static void RegisterBuiltins()
        {
            if (_initialized) return;
            _initialized = true;

            var reg = Instance;
            reg.RegisterCondition(new FlagEvaluator());
            reg.RegisterCondition(new ResourceEvaluator());
            reg.RegisterCondition(new VariableEvaluator());
            reg.RegisterCondition(new HasItemEvaluator());
            reg.RegisterCondition(new TimeWindowEvaluator());
            reg.RegisterCondition(new AndEvaluator());
            reg.RegisterCondition(new OrEvaluator());
            reg.RegisterCondition(new NotEvaluator());

            reg.RegisterEffect(new SetFlagApplicator());
            reg.RegisterEffect(new AddResourceApplicator());
            reg.RegisterEffect(new SetVariableApplicator());
            reg.RegisterEffect(new ModifyVariableApplicator());
            reg.RegisterEffect(new AddItemApplicator());
            reg.RegisterEffect(new RemoveItemApplicator());
            reg.RegisterEffect(new GotoApplicator());
        }
    }

    // ===== Built-in Condition Evaluators =====

    internal class FlagEvaluator : IConditionEvaluator
    {
        public string Type => "flag";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var fc = (FlagCondition)condition;
            var val = ctx.Flags.ContainsKey(fc.Key) ? ctx.Flags[fc.Key] : false;
            return val == fc.Value;
        }
    }

    internal class ResourceEvaluator : IConditionEvaluator
    {
        public string Type => "resource";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var rc = (ResourceCondition)condition;
            var val = ctx.Resources.ContainsKey(rc.Key) ? ctx.Resources[rc.Key] : 0;
            return rc.Op switch
            {
                ">=" => val >= rc.Value,
                "<=" => val <= rc.Value,
                ">" => val > rc.Value,
                "<" => val < rc.Value,
                "==" => Math.Abs(val - rc.Value) < 1e-9,
                _ => false
            };
        }
    }

    internal class VariableEvaluator : IConditionEvaluator
    {
        public string Type => "variable";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var vc = (VariableCondition)condition;
            ctx.Variables.TryGetValue(vc.Key, out var raw);
            if (raw is double numVal && vc.Value is double targetNum)
            {
                return vc.Op switch
                {
                    "==" => Math.Abs(numVal - targetNum) < 1e-9,
                    "!=" => Math.Abs(numVal - targetNum) >= 1e-9,
                    ">=" => numVal >= targetNum,
                    "<=" => numVal <= targetNum,
                    ">" => numVal > targetNum,
                    "<" => numVal < targetNum,
                    _ => false,
                };
            }
            var strVal = raw?.ToString() ?? string.Empty;
            var strTarget = vc.Value?.ToString() ?? string.Empty;
            return vc.Op switch
            {
                "==" => string.Equals(strVal, strTarget, StringComparison.Ordinal),
                "!=" => !string.Equals(strVal, strTarget, StringComparison.Ordinal),
                "contains" => strVal.Contains(strTarget),
                "!contains" => !strVal.Contains(strTarget),
                _ => false,
            };
        }
    }

    internal class HasItemEvaluator : IConditionEvaluator
    {
        public string Type => "hasItem";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var hc = (HasItemCondition)condition;
            var has = ctx.Inventory.Any(id => string.Equals(id, hc.Key, StringComparison.OrdinalIgnoreCase));
            return has == hc.Value;
        }
    }

    internal class TimeWindowEvaluator : IConditionEvaluator
    {
        public string Type => "timeWindow";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var tw = (TimeWindowCondition)condition;
            return ctx.Time >= tw.Start && ctx.Time <= tw.End;
        }
    }

    internal class AndEvaluator : IConditionEvaluator
    {
        public string Type => "and";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var ac = (AndCondition)condition;
            return ac.Conditions.All(c => InferenceRegistry.Instance.EvaluateCondition(c, ctx));
        }
    }

    internal class OrEvaluator : IConditionEvaluator
    {
        public string Type => "or";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var oc = (OrCondition)condition;
            return oc.Conditions.Any(c => InferenceRegistry.Instance.EvaluateCondition(c, ctx));
        }
    }

    internal class NotEvaluator : IConditionEvaluator
    {
        public string Type => "not";
        public bool Evaluate(Condition condition, EvaluationContext ctx)
        {
            var nc = (NotCondition)condition;
            return !InferenceRegistry.Instance.EvaluateCondition(nc.SubCondition, ctx);
        }
    }

    // ===== Built-in Effect Applicators =====

    internal class SetFlagApplicator : IEffectApplicator
    {
        public string Type => "setFlag";
        public Session Apply(Effect effect, Session session)
        {
            var sf = (SetFlagEffect)effect;
            var flags = new Dictionary<string, bool>(session.Flags) { [sf.Key] = sf.Value };
            return session.With(flags: flags);
        }
    }

    internal class AddResourceApplicator : IEffectApplicator
    {
        public string Type => "addResource";
        public Session Apply(Effect effect, Session session)
        {
            var ar = (AddResourceEffect)effect;
            var resources = new Dictionary<string, double>(session.Resources);
            resources[ar.Key] = (resources.ContainsKey(ar.Key) ? resources[ar.Key] : 0) + ar.Delta;
            return session.With(resources: resources);
        }
    }

    internal class SetVariableApplicator : IEffectApplicator
    {
        public string Type => "setVariable";
        public Session Apply(Effect effect, Session session)
        {
            var sv = (SetVariableEffect)effect;
            var variables = new Dictionary<string, object>(session.Variables) { [sv.Key] = sv.Value };
            return session.With(variables: variables);
        }
    }

    internal class ModifyVariableApplicator : IEffectApplicator
    {
        public string Type => "modifyVariable";
        public Session Apply(Effect effect, Session session)
        {
            var mv = (ModifyVariableEffect)effect;
            var variables = new Dictionary<string, object>(session.Variables);
            var cur = variables.ContainsKey(mv.Key) && variables[mv.Key] is double d ? d : 0.0;
            double result = mv.Op switch
            {
                "+" => cur + mv.Value,
                "-" => cur - mv.Value,
                "*" => cur * mv.Value,
                "/" => mv.Value != 0 ? cur / mv.Value : cur,
                _ => cur,
            };
            variables[mv.Key] = result;
            return session.With(variables: variables);
        }
    }

    internal class AddItemApplicator : IEffectApplicator
    {
        public string Type => "addItem";
        public Session Apply(Effect effect, Session session)
        {
            var ai = (AddItemEffect)effect;
            if (session.HasItem(ai.Key)) return session;
            var inventory = new List<string>(session.Inventory) { ai.Key };
            return session.With(inventory: inventory);
        }
    }

    internal class RemoveItemApplicator : IEffectApplicator
    {
        public string Type => "removeItem";
        public Session Apply(Effect effect, Session session)
        {
            var ri = (RemoveItemEffect)effect;
            var idx = session.Inventory.FindIndex(id => string.Equals(id, ri.Key, StringComparison.OrdinalIgnoreCase));
            if (idx == -1) return session;
            var inventory = new List<string>(session.Inventory);
            inventory.RemoveAt(idx);
            return session.With(inventory: inventory);
        }
    }

    internal class GotoApplicator : IEffectApplicator
    {
        public string Type => "goto";
        public Session Apply(Effect effect, Session session)
        {
            var go = (GotoEffect)effect;
            return session.With(currentNodeId: go.Target);
        }
    }
}
