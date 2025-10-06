using UnityEngine;
using NarrativeGen.Core;
using NarrativeGen.UI;
using System.Collections.Generic;

namespace NarrativeGen.Unity
{
    /// <summary>
    /// Unity統合用GameManagerコンポーネント
    /// 純粋なC# GameManagerをUnity環境で使用するためのラッパー
    /// </summary>
    public class GameManagerComponent : MonoBehaviour
    {
        private GameManager _gameManager;
        private UIManager _uiManager;

        void Awake()
        {
            // 純粋なC# GameManagerを初期化
            _gameManager = new GameManager();
            
            // UIManagerを自動検出
            _uiManager = FindFirstObjectByType<UIManager>();
            
            if (_uiManager != null)
            {
                // GameManagerのイベントをUIManagerに接続
                _gameManager.OnShowText += _uiManager.ShowText;
                _gameManager.OnShowChoices += _uiManager.ShowChoices;
                
                UnityEngine.Debug.Log("GameManagerComponent: UIManager連携完了");
            }
            else
            {
                UnityEngine.Debug.LogError("GameManagerComponent: UIManagerが見つかりません");
            }
        }

        void Start()
        {
            // ゲーム開始時の初期化
            _gameManager?.Initialize();
        }

        void OnDestroy()
        {
            // イベント購読解除
            if (_gameManager != null && _uiManager != null)
            {
                _gameManager.OnShowText -= _uiManager.ShowText;
                _gameManager.OnShowChoices -= _uiManager.ShowChoices;
            }
        }

        /// <summary>
        /// 外部からGameManagerにアクセスするためのプロパティ
        /// </summary>
        public GameManager GameManager => _gameManager;

        /// <summary>
        /// 選択肢が選ばれた時の処理
        /// </summary>
        public void OnChoiceSelected(int choiceIndex)
        {
            _gameManager?.ProcessChoice(choiceIndex);
        }

        /// <summary>
        /// 次のテキストを表示
        /// </summary>
        public void ShowNextText()
        {
            _gameManager?.ShowNext();
        }
    }
}
