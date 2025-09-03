using NUnit.Framework;
using NarrativeGen.Data;
using NarrativeGen.Data.Models;
using NarrativeGen.Logic;

namespace NarrativeGen.Core.Tests
{
    public class LogicEngineTests
    {
        [Test]
        public void StartNarrative_WithInvalidEventId_ReturnsErrorResult()
        {
            // Arrange - Create a simple DatabaseManager without mocking
            var databaseManager = new DatabaseManager();
            var worldState = new WorldState();

            var logicEngine = new LogicEngine(databaseManager, worldState);

            // Act
            var result = logicEngine.StartNarrative("non_existent_event");

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(NarrativeResult.ResultType.Error, result.Type);
            Assert.IsTrue(result.Text.Contains("開始イベント 'non_existent_event' が見つかりません"));
        }

        [Test]
        public void SimpleTest_AlwaysPasses()
        {
            // Basic test to verify test runner is working
            Assert.IsTrue(true);
        }
    }
}
