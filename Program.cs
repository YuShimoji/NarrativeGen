using NarrativeGen.Core;
using NarrativeGen.Core.Data;

var engine = new NarrativeEngine();
var result = engine.StartNarrative("START");

Console.WriteLine("生成されたナラティブ:");
Console.WriteLine(result.Text);

if (result.HasError)
{
    Console.WriteLine($"\nエラー発生: {result.ErrorMessage}");
}

Console.WriteLine("\n処理が完了しました。任意のキーを押して終了...");
Console.ReadKey();