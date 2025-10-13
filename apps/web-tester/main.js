import { GameSession } from '@narrativegen/engine-ts/dist/game-session.js'

const model = {
  modelType: 'web-test-model',
  startNode: 'entrance',
  nodes: {
    entrance: {
      id: 'entrance',
      text: 'スタート地点',
      choices: [
        { id: 'advance', text: '次へ進む', target: 'second' },
      ],
    },
    second: {
      id: 'second',
      text: '2番目のノード',
    },
  },
}

const entities = [
  {
    id: 'mac_burger_001',
    brand: 'MacBurger',
    description: 'おいしいバーガー',
    cost: 100,
  },
  {
    id: 'coffee_001',
    brand: 'CoffeeStand',
    description: '香り高いコーヒー',
    cost: 50,
  },
]

const startBtn = document.getElementById('startBtn')
const choicesContainer = document.getElementById('choices')
const stateView = document.getElementById('stateView')
const statusText = document.getElementById('statusText')

let session = null

function renderState() {
  if (!session) {
    stateView.textContent = JSON.stringify({ status: 'セッション未開始' }, null, 2)
    return
  }

  const snapshot = session.state
  const view = {
    nodeId: snapshot.nodeId,
    time: snapshot.time,
    flags: snapshot.flags,
    resources: snapshot.resources,
    inventory: session.listInventory(),
  }
  stateView.textContent = JSON.stringify(view, null, 2)
}

function setStatus(message, type = 'info') {
  statusText.textContent = message
  statusText.dataset.type = type
}

function renderChoices() {
  choicesContainer.innerHTML = ''

  if (!session) {
    const info = document.createElement('p')
    info.textContent = 'セッションを開始すると選択肢が表示されます'
    choicesContainer.appendChild(info)
    return
  }

  const choices = session.getAvailableChoices()
  if (!choices || choices.length === 0) {
    const empty = document.createElement('p')
    empty.textContent = '利用可能な選択肢はありません'
    choicesContainer.appendChild(empty)
    return
  }

  const list = document.createElement('div')
  list.style.display = 'flex'
  list.style.flexDirection = 'column'
  list.style.gap = '0.5rem'

  choices.forEach((choice) => {
    const button = document.createElement('button')
    button.textContent = formatChoiceLabel(choice)
    button.addEventListener('click', () => {
      try {
        session.applyChoice(choice.id)
        setStatus(`選択肢「${choice.text}」を適用しました`, 'success')
      } catch (err) {
        console.error(err)
        setStatus(`選択肢の適用に失敗しました: ${err?.message ?? err}`, 'warn')
      }
      renderState()
      renderChoices()
    })
    list.appendChild(button)
  })

  choicesContainer.appendChild(list)
}

function formatChoiceLabel(choice) {
  if (choice?.outcome) {
    return `${choice.text} (${choice.outcome.type}: ${choice.outcome.value})`
  }
  return choice?.text ?? '(不明な選択肢)'
}

startBtn.addEventListener('click', () => {
  session = new GameSession(model, {
    entities,
    initialInventory: [],
  })
  setStatus('セッションを開始しました', 'success')
  renderState()
  renderChoices()
})

setStatus('「セッション開始」を押して操作を始めてください')
renderState()
renderChoices()
