using System;
using System.Collections.Generic;
using System.IO;
using NarrativeGen;

static class Program
{
    static void Main(string[] args)
    {
        var modelPath = ResolveModelPath(args);
        Console.WriteLine($"Using model: {modelPath}");
        var json = File.ReadAllText(modelPath);

        var model = Engine.LoadModel(json);
        var session = Engine.StartSession(model);

        while (true)
        {
            var node = model.Nodes[session.CurrentNodeId];
            Console.WriteLine($"\nNode: {node.Id}");
            if (!string.IsNullOrEmpty(node.Text))
            {
                Console.WriteLine(node.Text);
            }

            var choices = Engine.GetAvailableChoices(session, model);
            if (choices.Count == 0)
            {
                Console.WriteLine("No more choices. End.");
                break;
            }

            Console.WriteLine("Choices:");
            for (int i = 0; i < choices.Count; i++)
            {
                Console.WriteLine($"  {i + 1}. {choices[i].Id} - {choices[i].Text}");
            }

            // Auto-select the first choice for CI-like flow
            var selected = choices[0];
            Console.WriteLine($"Selecting: {selected.Id} - {selected.Text}");
            session = Engine.ApplyChoice(session, model, selected.Id);
        }
    }

    static string ResolveModelPath(string[] args)
    {
        // 1) If provided by arg
        if (args.Length > 0 && File.Exists(args[0])) return Path.GetFullPath(args[0]);

        var candidates = new List<string>
        {
            // From repo root
            @".\models\examples\linear.json",
            // From project directory
            @"..\..\..\..\models\examples\linear.json",
            // From bin/Debug/net6.0
            @"..\..\..\..\..\..\models\examples\linear.json"
        };

        foreach (var rel in candidates)
        {
            var p = Path.GetFullPath(rel);
            if (File.Exists(p)) return p;
        }
        throw new FileNotFoundException("Could not locate models/examples/linear.json. Pass a path as the first argument.");
    }
}
