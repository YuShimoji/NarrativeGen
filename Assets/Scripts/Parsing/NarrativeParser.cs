using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using UnityEngine;

namespace NarrativeGen.Parsing
{
    /// <summary>
    /// Advanced narrative parser that handles hierarchical bracket structures
    /// and dynamic entity-based descriptions.
    /// </summary>
    public class NarrativeParser
    {
        /// <summary>
        /// Represents a parsed narrative element with hierarchical structure.
        /// </summary>
        public class NarrativeElement
        {
            public string Content { get; set; }
            public List<NarrativeElement> Children { get; set; }
            public NarrativeElementType Type { get; set; }
            public Dictionary<string, object> Properties { get; set; }

            public NarrativeElement()
            {
                Children = new List<NarrativeElement>();
                Properties = new Dictionary<string, object>();
            }

            public bool HasChildren => Children != null && Children.Count > 0;
        }

        /// <summary>
        /// Types of narrative elements for context classification.
        /// </summary>
        public enum NarrativeElementType
        {
            Text,           // Plain text
            EntityRef,      // Reference to an entity [entityName]
            SceneDesc,      // Scene description context
            ThoughtDesc,    // Thought description context
            ActionDesc,     // Action description context
            Nested          // Nested hierarchical structure
        }

        /// <summary>
        /// Parses a hierarchical bracket structure into a tree of NarrativeElements.
        /// Example: "[[あなたは][[薄暗い[石の部屋]][に立っている。]]"
        /// </summary>
        public static NarrativeElement ParseHierarchicalText(string input)
        {
            if (string.IsNullOrEmpty(input))
                return new NarrativeElement { Content = "", Type = NarrativeElementType.Text };

            try
            {
                return ParseBracketLevel(input, 0, out _);
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogError($"NarrativeParser - Error parsing hierarchical text: {ex.Message}");
                return new NarrativeElement { Content = input, Type = NarrativeElementType.Text };
            }
        }

        /// <summary>
        /// Recursive method to parse bracket levels.
        /// </summary>
        private static NarrativeElement ParseBracketLevel(string input, int startIndex, out int endIndex)
        {
            var element = new NarrativeElement();
            var contentBuilder = new StringBuilder();
            int i = startIndex;
            
            while (i < input.Length)
            {
                if (input[i] == '[')
                {
                    // Check if this is a double bracket [[
                    if (i + 1 < input.Length && input[i + 1] == '[')
                    {
                        // Found nested structure, parse it recursively
                        var nestedElement = ParseBracketLevel(input, i + 2, out int nestedEndIndex);
                        nestedElement.Type = NarrativeElementType.Nested;
                        element.Children.Add(nestedElement);
                        i = nestedEndIndex;
                    }
                    else
                    {
                        // Single bracket, parse as entity reference or simple nested content
                        var nestedElement = ParseBracketLevel(input, i + 1, out int nestedEndIndex);
                        nestedElement.Type = DetermineElementType(nestedElement.Content);
                        element.Children.Add(nestedElement);
                        i = nestedEndIndex;
                    }
                }
                else if (input[i] == ']')
                {
                    // End of current bracket level
                    element.Content = contentBuilder.ToString().Trim();
                    endIndex = i + 1;
                    
                    // Check if this ends a double bracket ]]
                    if (i + 1 < input.Length && input[i + 1] == ']')
                    {
                        endIndex = i + 2;
                    }
                    
                    return element;
                }
                else
                {
                    contentBuilder.Append(input[i]);
                    i++;
                }
            }

            // If we reach here, no closing bracket was found
            element.Content = contentBuilder.ToString().Trim();
            endIndex = input.Length;
            return element;
        }

        /// <summary>
        /// Determines the type of narrative element based on its content.
        /// </summary>
        private static NarrativeElementType DetermineElementType(string content)
        {
            if (string.IsNullOrEmpty(content))
                return NarrativeElementType.Text;

            // Check for entity references (single words that could be entities)
            if (IsEntityReference(content))
                return NarrativeElementType.EntityRef;

            // Check for context indicators
            if (content.Contains("思") || content.Contains("考え") || content.Contains("気持ち"))
                return NarrativeElementType.ThoughtDesc;
            
            if (content.Contains("行動") || content.Contains("動作") || content.Contains("した"))
                return NarrativeElementType.ActionDesc;

            // Default to scene description
            return NarrativeElementType.SceneDesc;
        }

        /// <summary>
        /// Checks if the content is likely an entity reference.
        /// </summary>
        private static bool IsEntityReference(string content)
        {
            // Simple heuristic: single word without common particles
            var trimmed = content.Trim();
            return !string.IsNullOrEmpty(trimmed) && 
                   !trimmed.Contains("。") && 
                   !trimmed.Contains("、") && 
                   !trimmed.Contains("は") && 
                   !trimmed.Contains("を") && 
                   !trimmed.Contains("に") && 
                   trimmed.Length <= 10; // Reasonable entity name length
        }

        /// <summary>
        /// Renders a parsed narrative element back to display text.
        /// This method applies entity resolution and context-aware generation.
        /// </summary>
        public static string RenderToText(NarrativeElement element, Dictionary<string, string> entityDescriptions = null)
        {
            if (element == null)
                return "";

            var result = new StringBuilder();
            
            // Handle entity references
            if (element.Type == NarrativeElementType.EntityRef && entityDescriptions != null)
            {
                if (entityDescriptions.TryGetValue(element.Content, out string description))
                {
                    result.Append(description);
                }
                else
                {
                    result.Append(element.Content);
                }
            }
            else
            {
                // Add the element's own content
                result.Append(element.Content);
            }

            // Recursively render children
            foreach (var child in element.Children)
            {
                result.Append(RenderToText(child, entityDescriptions));
            }

            return result.ToString();
        }

        /// <summary>
        /// Debugging method to visualize the parsed structure.
        /// </summary>
        public static string DebugPrintStructure(NarrativeElement element, int depth = 0)
        {
            if (element == null)
                return "";

            var indent = new string(' ', depth * 2);
            var result = new StringBuilder();
            
            result.AppendLine($"{indent}[{element.Type}] \"{element.Content}\"");
            
            foreach (var child in element.Children)
            {
                result.Append(DebugPrintStructure(child, depth + 1));
            }

            return result.ToString();
        }
    }
} 