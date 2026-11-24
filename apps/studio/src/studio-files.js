const trialKey = 'ng-studio:trial'
const trialHash = '#trial'

export function openTrialTab(result) {
  const data = JSON.stringify(result)
  const tab = window.open('', '_blank')
  if (!tab) throw new Error('ブラウザで別タブの表示を許可してください。')
  try {
    tab.opener = null
    tab.sessionStorage.setItem(trialKey, data)
    tab.location.replace(new URL(`./${trialHash}`, location.href))
  } catch (error) {
    tab.close()
    throw error
  }
}

export function takeTrial() {
  if (location.hash !== trialHash) return null
  history.replaceState(history.state, '', location.pathname + location.search)
  const raw = sessionStorage.getItem(trialKey)
  sessionStorage.removeItem(trialKey)
  const result = raw && JSON.parse(raw)
  if (!result?.premise || !result.story?.model || !result.story.derivation) {
    throw new Error('前提入力で試算してから、もう一度「この物語を開く」を押してください。')
  }
  return result
}

export function downloadJson(name, value) {
  const blob = new Blob([JSON.stringify(value, null, 2) + '\n'], { type: 'application/json' })
  const filename = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '') || '物語'
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return link.download
}
