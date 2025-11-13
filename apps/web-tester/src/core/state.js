/**
 * アプリケーション状態管理モジュール
 * @module core/state
 */

export class AppState {
  constructor() {
    this._session = null;
    this._model = null;
    this._storyLog = [];
    this._listeners = new Map();
  }

  // ゲッター・セッター + イベント発火
  get session() { return this._session; }
  set session(value) {
    this._session = value;
    this.emit('session:changed', value);
  }

  get model() { return this._model; }
  set model(value) {
    this._model = value;
    this.emit('model:changed', value);
  }

  get storyLog() { return this._storyLog; }
  set storyLog(value) {
    this._storyLog = value;
    this.emit('storyLog:changed', value);
  }

  // イベントリスナー管理
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  off(event, callback) {
    const callbacks = this._listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    const callbacks = this._listeners.get(event) || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // 状態のシリアライズ
  serialize() {
    return {
      session: this._session,
      model: this._model,
      storyLog: this._storyLog
    };
  }

  // 状態の復元
  deserialize(data) {
    this._session = data.session;
    this._model = data.model;
    this._storyLog = data.storyLog;
    this.emit('state:restored', data);
  }
}

// グローバル状態インスタンス
export const appState = new AppState();

/**
 * 状態変更をDOMに反映するヘルパー
 * @param {string} event - イベント名
 * @param {Function} updater - 更新関数
 */
export function connectState(event, updater) {
  appState.on(event, updater);
  // 初回実行
  updater(appState[event.split(':')[0]]);
}
