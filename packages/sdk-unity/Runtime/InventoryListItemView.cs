#if UNITY_5_3_OR_NEWER
using TMPro;
using UnityEngine;

namespace NarrativeGen
{
    /// <summary>
    /// Displays a single inventory entity entry.
    /// </summary>
    public class InventoryListItemView : MonoBehaviour
    {
        [SerializeField]
        private TextMeshProUGUI? _title;

        [SerializeField]
        private TextMeshProUGUI? _description;

        [SerializeField]
        private TextMeshProUGUI? _cost;

        /// <summary>
        /// Populates the view with the supplied entity data.
        /// </summary>
        /// <param name="entity">Entity to display.</param>
        public void Bind(Entity entity)
        {
            if (_title != null)
            {
                _title.text = entity.Brand;
            }

            if (_description != null)
            {
                _description.text = entity.Description;
            }

            if (_cost != null)
            {
                _cost.text = entity.Cost == 0
                    ? string.Empty
                    : entity.Cost.ToString("N0");
            }
        }
    }
}
#endif
