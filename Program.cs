using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NarrativeGen.Core;
using System;
using System.IO;

namespace NarrativeGen.Console
{
    /// <summary>
    /// Cursor webでテスト可能なコンソールアプリケーション
    /// Unity非依存でナラティブエンジンの動作確認が可能
    /// </summary>
    class Program
    {
        private static NarrativeEngine? _engine;
        private static ILogger<Program>? _logger;

        static void Main(string[] args)
        {
            // ロギングの設定
            var services = new ServiceCollection();
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Debug);
            });

            var serviceProvider = services.BuildServiceProvider();
            _logger = serviceProvider.GetRequiredService<ILogger<Program>>();

            _logger.LogInformation("NarrativeGen Console Application Starting...");

            try
            {
                // データディレクトリの設定
                var dataPath = GetDataPath();
                _logger.LogInformation("Data path: {DataPath}", dataPath);

                // エンジンの初期化
                _engine = new NarrativeEngine(dataPath, serviceProvider.GetRequiredService<ILogger<NarrativeEngine>>());
                _engine.Initialize();

                _logger.LogInformation("Engine initialized successfully!");
                _logger.LogInformation(_engine.GetStatistics());

                // インタラクティブモードの開始
                RunInteractiveMode();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error occurred");
                System.Console.WriteLine($"エラーが発生しました: {ex.Message}");
                System.Console.WriteLine("Press any key to exit...");
                System.Console.ReadKey();
            }
        }

        /// <summary>
        /// インタラクティブモードの実行
        /// </summary>
        static void RunInteractiveMode()
        {
            if (_engine == null)
            {
                System.Console.WriteLine("エンジンが初期化されていません");
                return;
            }

            System.Console.WriteLine("\n=== NarrativeGen インタラクティブモード ===");
            System.Console.WriteLine("コマンド一覧:");
            System.Console.WriteLine("  start [eventId] - ナラティブを開始");
            System.Console.WriteLine("  process [eventId] - イベントを処理");
            System.Console.WriteLine("  set [key] [value] - 世界状態を設定");
            System.Console.WriteLine("  get [key] - 世界状態を取得");
            System.Console.WriteLine("  test - サンプルテストを実行");
            System.Console.WriteLine("  stats - 統計情報を表示");
            System.Console.WriteLine("  exit - 終了");
            System.Console.WriteLine();

            while (true)
            {
                System.Console.Write("> ");
                var input = System.Console.ReadLine()?.Trim();
                
                if (string.IsNullOrEmpty(input))
                    continue;

                var parts = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var command = parts[0].ToLower();

                try
                {
                    switch (command)
                    {
                        case "start":
                            var startEventId = parts.Length > 1 ? parts[1] : "START";
                            HandleStartCommand(startEventId);
                            break;

                        case "process":
                            if (parts.Length > 1)
                            {
                                HandleProcessCommand(parts[1]);
                            }
                            else
                            {
                                System.Console.WriteLine("使用法: process [eventId]");
                            }
                            break;

                        case "set":
                            if (parts.Length > 2)
                            {
                                HandleSetCommand(parts[1], string.Join(" ", parts[2..]));
                            }
                            else
                            {
                                System.Console.WriteLine("使用法: set [key] [value]");
                            }
                            break;

                        case "get":
                            if (parts.Length > 1)
                            {
                                HandleGetCommand(parts[1]);
                            }
                            else
                            {
                                System.Console.WriteLine("使用法: get [key]");
                            }
                            break;

                        case "test":
                            RunSampleTests();
                            break;

                        case "stats":
                            System.Console.WriteLine(_engine.GetStatistics());
                            break;

                        case "exit":
                            return;

                        default:
                            System.Console.WriteLine($"不明なコマンド: {command}");
                            break;
                    }
                }
                catch (Exception ex)
                {
                    System.Console.WriteLine($"コマンド実行エラー: {ex.Message}");
                    _logger?.LogError(ex, "Command execution error");
                }

                System.Console.WriteLine();
            }
        }

        /// <summary>
        /// STARTコマンドの処理
        /// </summary>
        static void HandleStartCommand(string eventId)
        {
            if (_engine == null) return;

            System.Console.WriteLine($"ナラティブを開始: {eventId}");
            var result = _engine.StartNarrative(eventId);
            DisplayResult(result);
        }

        /// <summary>
        /// PROCESSコマンドの処理
        /// </summary>
        static void HandleProcessCommand(string eventId)
        {
            if (_engine == null) return;

            System.Console.WriteLine($"イベントを処理: {eventId}");
            var result = _engine.ProcessEvent(eventId);
            DisplayResult(result);
        }

        /// <summary>
        /// SETコマンドの処理
        /// </summary>
        static void HandleSetCommand(string key, string value)
        {
            if (_engine == null) return;

            _engine.SetWorldState(key, value);
            System.Console.WriteLine($"設定しました: {key} = {value}");
        }

        /// <summary>
        /// GETコマンドの処理
        /// </summary>
        static void HandleGetCommand(string key)
        {
            if (_engine == null) return;

            var value = _engine.GetWorldState<object>(key);
            System.Console.WriteLine($"{key} = {value ?? "null"}");
        }

        /// <summary>
        /// 結果の表示
        /// </summary>
        static void DisplayResult(NarrativeEngine.NarrativeResult result)
        {
            if (result.HasError)
            {
                System.Console.WriteLine($"❌ エラー: {result.ErrorMessage}");
                return;
            }

            if (result.HasText)
            {
                System.Console.WriteLine($"📝 テキスト: {result.Text}");
            }

            if (result.HasChoices)
            {
                System.Console.WriteLine("🔀 選択肢:");
                for (int i = 0; i < result.Choices.Count; i++)
                {
                    System.Console.WriteLine($"  {i + 1}. {result.Choices[i].Text} -> {result.Choices[i].NextEventId}");
                }
            }

            if (result.HasNextEvent)
            {
                System.Console.WriteLine($"➡️  次のイベント: {result.NextEventId}");
            }
        }

        /// <summary>
        /// サンプルテストの実行
        /// </summary>
        static void RunSampleTests()
        {
            if (_engine == null) return;

            System.Console.WriteLine("=== サンプルテスト実行 ===");

            // テスト1: 遡行検索機能
            System.Console.WriteLine("\n📋 テスト1: 遡行検索機能");
            TestRecursiveResolution();

            // テスト2: Entity-Property システム
            System.Console.WriteLine("\n📋 テスト2: Entity-Property システム");
            TestEntityPropertySystem();

            // テスト3: テキスト内コマンド
            System.Console.WriteLine("\n📋 テスト3: テキスト内コマンド");
            TestTextCommands();

            System.Console.WriteLine("\n✅ 全テスト完了");
        }

        /// <summary>
        /// 遡行検索機能のテスト
        /// </summary>
        static void TestRecursiveResolution()
        {
            // サンプル遡行検索テスト
            _engine!.SetWorldState("test_recursive", "[そこに置いてある][傘]は[壊れ]ている。");
            var result = _engine.ProcessEvent("test_recursive_event");
            System.Console.WriteLine($"入力: [そこに置いてある][傘]は[壊れ]ている。");
            System.Console.WriteLine($"結果: {result.Text}");
        }

        /// <summary>
        /// Entity-Propertyシステムのテスト
        /// </summary>
        static void TestEntityPropertySystem()
        {
            // チーズバーガー例のテスト
            var cheeseburger = _engine!.CreateEntity("test_cheeseburger", "誰々が食べていたマックのチーズバーガー");
            cheeseburger.SetProperty("重さ", 0.12f);
            cheeseburger.SetProperty("大きさ", 0.35f);

            var observer = _engine.CreateEntity("test_observer", "都会の現代人");
            observer.SetProperty("expected_重さ", 0.1f);
            observer.SetProperty("tolerance_重さ", 10.0f);

            var inconsistency = _engine.DetectInconsistency("test_observer", "test_cheeseburger", "重さ");
            System.Console.WriteLine($"違和感検出結果: {inconsistency}");
        }

        /// <summary>
        /// テキスト内コマンドのテスト
        /// </summary>
        static void TestTextCommands()
        {
            _engine!.SetWorldState("test_commands", "{おはよう||こんにちは||こんばんは}、[お客様]。");
            var result = _engine.ProcessEvent("test_commands_event");
            System.Console.WriteLine($"ランダム選択テスト: {result.Text}");
        }

        /// <summary>
        /// データパスの取得
        /// </summary>
        static string GetDataPath()
        {
            // 複数の候補から検索
            var candidates = new[]
            {
                "Data",                                    // カレントディレクトリのDataフォルダ
                "Assets/StreamingAssets/NarrativeData",   // Unity StreamingAssetsフォルダ
                "../Assets/StreamingAssets/NarrativeData", // 一つ上のディレクトリ
                "../../Assets/StreamingAssets/NarrativeData" // 二つ上のディレクトリ
            };

            foreach (var candidate in candidates)
            {
                if (Directory.Exists(candidate))
                {
                    return Path.GetFullPath(candidate);
                }
            }

            // 見つからない場合はカレントディレクトリにDataフォルダを作成
            var defaultPath = "Data";
            Directory.CreateDirectory(defaultPath);
            CreateSampleDataFiles(defaultPath);
            return Path.GetFullPath(defaultPath);
        }

        /// <summary>
        /// サンプルデータファイルの作成
        /// </summary>
        static void CreateSampleDataFiles(string dataPath)
        {
            _logger?.LogInformation("Creating sample data files in: {DataPath}", dataPath);

            // RecursiveDictionary.csv
            var recursivePath = Path.Combine(dataPath, "RecursiveDictionary.csv");
            File.WriteAllText(recursivePath, @"Key,Value,Category,Priority,Description
そこに置いてある,そこの,location,1,場所を示す言葉
傘,古い傘,object,1,物体の説明
壊れ,壊れかけ,state,1,状態の説明
お客様,お客さん,person,1,人物の呼称");

            // Events.csv
            var eventsPath = Path.Combine(dataPath, "Events.csv");
            File.WriteAllText(eventsPath, @"Id,Text,Commands,Conditions
START,ナラティブエンジンの動作テストを開始します。,CHOICE ""テストを実行"" test_event,
test_event,[今日は]{良い||素晴らしい||最高の}[天気]ですね。,GOTO END,
test_recursive_event,[そこに置いてある][傘]は[壊れ]ている。,,
test_commands_event,{おはよう||こんにちは||こんばんは}、[お客様]。,,
END,テストが完了しました。,,");

            // Properties.csv
            var propertiesPath = Path.Combine(dataPath, "Properties.csv");
            File.WriteAllText(propertiesPath, @"Name,Type,DefaultValue,Category,Description
player_name,string,プレイヤー,character,プレイヤーの名前
current_location,string,開始地点,world,現在の場所
test_variable,int,0,system,テスト用変数");

            // Variables.csv
            var variablesPath = Path.Combine(dataPath, "Variables.csv");
            File.WriteAllText(variablesPath, @"Name,Type,DefaultValue,Range,Description
test_int,int,42,,テスト用整数
test_float,float,3.14,,テスト用浮動小数点
test_string,string,Hello World,,テスト用文字列");

            _logger?.LogInformation("Sample data files created successfully");
        }
    }
} 