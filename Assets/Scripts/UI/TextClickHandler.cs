using UnityEngine;
using UnityEngine.EventSystems;
using TMPro;
using System.Collections.Generic;
using System.Collections;

namespace NarrativeGen.UI
{
    /// <summary>
    /// ログテキストをクリックした時の言い換え機能を提供
    /// </summary>
    public class TextClickHandler : MonoBehaviour, IPointerClickHandler
    {
        #region Private Fields
        [Header("Text Variants")]
        [SerializeField] private List<string> m_TextVariants = new List<string>();
        
        [Header("Animation Settings")]
        [SerializeField] private float m_FadeOutDuration = 0.3f;
        [SerializeField] private float m_FadeInDuration = 0.5f;
        [SerializeField] private Color m_HighlightColor = Color.yellow;
        
        private TextMeshProUGUI m_TextComponent;
        private int m_CurrentVariantIndex = 0;
        private Color m_OriginalColor;
        private bool m_IsAnimating = false;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            m_TextComponent = GetComponent<TextMeshProUGUI>();
            if (m_TextComponent != null)
            {
                m_OriginalColor = m_TextComponent.color;
                if (m_TextVariants.Count == 0 && !string.IsNullOrEmpty(m_TextComponent.text))
                {
                    m_TextVariants.Add(m_TextComponent.text);
                }
            }
        }
        #endregion

        #region Public Methods
        public void OnPointerClick(PointerEventData eventData)
        {
            if (m_IsAnimating || m_TextVariants.Count <= 1) return;
            StartCoroutine(ChangeTextWithAnimation());
        }

        public void AddVariant(string variant)
        {
            if (!m_TextVariants.Contains(variant))
            {
                m_TextVariants.Add(variant);
            }
        }

        public void SetVariants(List<string> variants)
        {
            m_TextVariants = new List<string>(variants);
            m_CurrentVariantIndex = 0;
            if (m_TextComponent != null && m_TextVariants.Count > 0)
            {
                m_TextComponent.text = m_TextVariants[0];
            }
        }
        #endregion

        #region Private Methods
        private IEnumerator ChangeTextWithAnimation()
        {
            m_IsAnimating = true;

            // Highlight effect
            m_TextComponent.color = m_HighlightColor;
            yield return new WaitForSeconds(0.1f);

            // Fade out
            yield return StartCoroutine(FadeText(1f, 0f, m_FadeOutDuration));

            // Change text
            m_CurrentVariantIndex = (m_CurrentVariantIndex + 1) % m_TextVariants.Count;
            m_TextComponent.text = m_TextVariants[m_CurrentVariantIndex];

            // Fade in
            yield return StartCoroutine(FadeText(0f, 1f, m_FadeInDuration));

            m_TextComponent.color = m_OriginalColor;
            m_IsAnimating = false;
        }

        private IEnumerator FadeText(float startAlpha, float endAlpha, float duration)
        {
            float elapsedTime = 0f;
            Color currentColor = m_TextComponent.color;

            while (elapsedTime < duration)
            {
                elapsedTime += Time.deltaTime;
                float alpha = Mathf.Lerp(startAlpha, endAlpha, elapsedTime / duration);
                currentColor.a = alpha;
                m_TextComponent.color = currentColor;
                yield return null;
            }

            currentColor.a = endAlpha;
            m_TextComponent.color = currentColor;
        }
        #endregion
    }
} 