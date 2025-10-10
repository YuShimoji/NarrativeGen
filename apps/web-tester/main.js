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
const addItemBtn = document.getElementById('addItemBtn')
const itemInput = document.getElementById('itemInput')
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

startBtn.addEventListener('click', () => {
  session = new GameSession(model, {
    entities,
    initialInventory: [],
  })
  setStatus('セッションを開始しました', 'success')
  addItemBtn.disabled = false
  renderState()
})

addItemBtn.addEventListener('click', () => {
  if (!session) {
    setStatus('セッションを開始してください', 'warn')
    return
  }

  const id = itemInput.value.trim()
  if (!id) {
    setStatus('アイテムIDを入力してください', 'warn')
    return
  }

  const entity = session.pickupEntity(id)
  if (!entity) {
    setStatus(`アイテム「${id}」は存在しません`, 'warn')
    return
  }

  setStatus(`アイテム「${entity.id}」を追加しました`, 'success')
  renderState()
  itemInput.value = ''
})

itemInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addItemBtn.click()
  }
})

setStatus('「セッション開始」を押して操作を始めてください')
renderState()
