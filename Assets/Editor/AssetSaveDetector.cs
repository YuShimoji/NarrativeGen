using UnityEditor;
using UnityEngine;

public class AssetSaveDetector : UnityEditor.AssetModificationProcessor
{
    static string[] OnWillSaveAssets(string[] paths)
    {
        // 保存されようとしているアセットのパスをコンソールに出力する
        foreach (string path in paths)
        {
            Debug.Log("Saving Asset: " + path);
        }
        return paths;
    }
}