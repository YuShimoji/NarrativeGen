using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using NarrativeGen.Data.Models;

namespace NarrativeGen.Parsing
{
    public static class CommandParser
    {
        // Matches a command like `CMD(arg1, arg2)`
        private static readonly Regex CommandRegex = new Regex(@"(\w+)\s*\((.*)\)");

        /// <summary>
        /// Tries to parse a single command string (e.g., "SAY(Speaker, Text)") into its components.
        /// </summary>
        /// <param name="commandString">The raw command string.</param>
        /// <param name="commandName">The extracted command name (e.g., "SAY").</param>
        /// <param name="args">The list of extracted arguments.</param>
        /// <returns>True if parsing was successful, false otherwise.</returns>
        public static bool TryParse(string commandString, out string commandName, out List<string> args)
        {
            commandName = null;
            args = new List<string>();

            var match = CommandRegex.Match(commandString.Trim());
            if (!match.Success)
            {
                if (!commandString.Contains("(") && !commandString.Contains(")"))
                {
                     commandName = commandString.Trim();
                     return true;
                }
                return false;
            }

            commandName = match.Groups[1].Value;
            string argsString = match.Groups[2].Value.Trim();

            if (string.IsNullOrEmpty(argsString))
            {
                return true;
            }
            
            // Special handling for SAY command - split only on the first comma
            if (commandName.ToUpper() == "SAY")
            {
                var firstCommaIndex = argsString.IndexOf(',');
                if (firstCommaIndex > 0)
                {
                    var speaker = argsString.Substring(0, firstCommaIndex).Trim();
                    var text = argsString.Substring(firstCommaIndex + 1).Trim();
                    args.Add(speaker);
                    args.Add(text);
                    return true;
                }
                else
                {
                    return false;
                }
            }
            
            string[] rawArgs = argsString.Split(',');

            foreach (var arg in rawArgs)
            {
                var trimmedArg = arg.Trim();
                if (trimmedArg.StartsWith("\"") && trimmedArg.EndsWith("\"") && trimmedArg.Length >= 2)
                {
                    trimmedArg = trimmedArg.Substring(1, trimmedArg.Length - 2);
                }
                args.Add(trimmedArg);
            }

            return true;
        }

        public static string[] SplitCommand(string command)
        {
            return command.Split(new[] { ' ' }, 2);
        }

        public static List<string> ParseCommands(string commandScript)
        {
            return commandScript.Split(';').Select(c => c.Trim()).Where(c => !string.IsNullOrEmpty(c)).ToList();
        }

        public static (string Speaker, string Text) ParseSayCommand(string args)
        {
            var match = Regex.Match(args, "^(\\w+)\\s+\"(.+)\"$");
            if (match.Success)
            {
                return (match.Groups[1].Value, match.Groups[2].Value);
            }
            return ("narrator", args.Trim('\"'));
        }

        public static (string Condition, List<string> Commands) ParseIfCommand(string args)
        {
            var match = Regex.Match(args, "^\\((.+?)\\)\\s*\\{(.+)\\}$");
            if (match.Success)
            {
                var condition = match.Groups[1].Value.Trim();
                var commands = ParseCommands(match.Groups[2].Value);
                return (condition, commands);
            }
            return (args, new List<string>());
        }
    }
} 