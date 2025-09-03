using System;
using System.Linq;
using NarrativeGen.Data;
using NarrativeGen.Data.Models;
using NarrativeGen.Logic;
using UnityEngine;
using System.Collections.Generic;
using NarrativeResult = NarrativeGen.Data.Models.NarrativeResult;

namespace NarrativeGen.Parsing
{
    /// <summary>
    /// Executes narrative commands, modifying the WorldState and NarrativeResult.
    /// This class centralizes the logic for how each command operates.
    /// </summary>
    public class CommandExecutor
    {
        private readonly WorldState _worldState;
        private readonly DatabaseManager _databaseManager;
        private readonly DynamicNarrativeGenerator _narrativeGenerator;
        private readonly Func<string, NarrativeResult> _executeEventCallback;
        private readonly Func<NarrativeResult> _invokeReasoningCallback;

        public CommandExecutor(WorldState worldState, DatabaseManager databaseManager, DynamicNarrativeGenerator narrativeGenerator, Func<string, NarrativeResult> executeEventCallback, Func<NarrativeResult> invokeReasoningCallback)
        {
            _worldState = worldState;
            _databaseManager = databaseManager;
            _narrativeGenerator = narrativeGenerator;
            _executeEventCallback = executeEventCallback;
            _invokeReasoningCallback = invokeReasoningCallback;
        }

        public NarrativeResult Execute(string command)
        {
            var result = new NarrativeResult();
            var parts = CommandParser.SplitCommand(command);
            var commandName = parts[0].ToUpper();

            switch (commandName)
            {
                case "SAY":
                    var sayParts = CommandParser.ParseSayCommand(parts[1]);
                    result.Speaker = sayParts.Speaker;
                    result.Text = _narrativeGenerator.GenerateText(sayParts.Text);
                    break;

                case "SET":
                    var setParts = parts[1].Split('=');
                    if (setParts.Length == 2)
                    {
                        _worldState.SetProperty(setParts[0].Trim(), setParts[1].Trim());
                    }
                    break;

                case "IF":
                    var ifParts = CommandParser.ParseIfCommand(parts[1]);
                    if (_worldState.EvaluateCondition(ifParts.Condition))
                    {
                        // Don't execute recursively. Instead, chain the commands for the GameManager to handle.
                        result.ChainedCommands.AddRange(ifParts.Commands);
                        result.Type = NarrativeResult.ResultType.StateChange; // Indicate that something happened
                    }
                    break;
                
                case "SHOW_CHOICES":
                    var category = parts.Length > 1 ? parts[1] : "default";
                    var availableChoiceData = GetAvailableChoices(category);
                    var uiChoices = availableChoiceData.Select(data => new Choice
                    {
                        Text = _narrativeGenerator.GenerateText(data.Text),
                        NextEventId = data.NextEventId
                    }).ToList();
                    result.Choices.AddRange(uiChoices);
                    break;

                case "INCREMENT":
                    _worldState.IncrementProperty(parts[1]);
                    break;

                case "INVOKE_REASONING":
                    // This command is special. It asks the LogicEngine to run the reasoning process.
                    // We can pass parameters here in the future, e.g., INVOKE_REASONING with_focus=player
                    if (_invokeReasoningCallback != null)
                    {
                        return _invokeReasoningCallback();
                    }
                    break;

                case "GOTO":
                    result.NextEventId = parts[1].Trim();
                    break;

                // 他のコマンド(SHOW_CHOICES, INCREMENTなど)はLogicEngineからここに移動する必要がある
                
                default:
                    UnityEngine.Debug.LogWarning($"CommandExecutor: Unknown command '{commandName}'");
                    break;
            }

            return result;
        }

        private List<ChoiceData> GetAvailableChoices(string category)
        {
            var availableChoices = new List<ChoiceData>();
            if (_databaseManager.ChoiceGroups == null || !_databaseManager.ChoiceGroups.ContainsKey(category)) return availableChoices;

            var choicesInCategory = _databaseManager.ChoiceGroups[category];
            foreach (var choiceData in choicesInCategory)
            {
                if (_worldState.EvaluateCondition(choiceData.Conditions))
                {
                    availableChoices.Add(choiceData);
                }
            }
            return availableChoices;
        }

        public NarrativeResult ExecuteCommands(string commandScript)
        {
            var finalResult = new NarrativeResult();
            var commands = CommandParser.ParseCommands(commandScript);

            foreach (var command in commands)
            {
                var result = Execute(command);
                finalResult.Merge(result);

                if (!string.IsNullOrEmpty(result.NextEventId))
                {
                    // If a GOTO is found, stop processing subsequent commands in this block.
                    break;
                }
            }
            return finalResult;
        }
    }
}