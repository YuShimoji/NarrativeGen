/**
 * アプリケーション状態管理モジュール
 * @module core/state
 */

import Logger from './logger.js';

/**
 * DescriptionState を深いコピーする（JSON 互換のプレーンオブジェクトのみ想定）
 * @param {Record<string, unknown>} state
 * @returns {Record<string, unknown>}
 */
function cloneDescriptionState(state) {
  if (!state || typeof state !== 'object') {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(state));
  } catch {
    return {};
  }
}

export class AppState {
  constructor() {
    this._session = null;
    this._model = null;
    this._storyLog = [];
    /** SP-TGEN 段階2: 本文 `[entity~]` 描写追跡（エンジン DescriptionState 互換） */
    this._descriptionState = {};
    /** Undo 用: `pushHistory` と同じタイミングで積む `descriptionState` のスナップショット */
    this._descriptionStateHistory = [];
    this._listeners = new Map();
  }

  /** 描写追跡状態（プレイ本線の resolveNarrativeDisplayTextTracked 用） */
  get descriptionState() {
    return this._descriptionState;
  }

  set descriptionState(value) {
    this._descriptionState = value && typeof value === 'object' ? value : {};
  }

  /** Undo 用スタックを空にする（セッション履歴リセット時と `resetDescriptionTracking` から利用） */
  clearDescriptionStateHistory() {
    this._descriptionStateHistory = [];
  }

  /** 現在の `descriptionState` を深いコピーで履歴に積む（選択適用・`pushHistory` の直前） */
  pushDescriptionStateSnapshot() {
    this._descriptionStateHistory.push(cloneDescriptionState(this._descriptionState));
  }

  /**
   * 直近のスナップショットを復元（`popHistory` 成功後に呼ぶ）
   * スタックが空のときは `resetDescriptionTracking` で整合を取る
   */
  popDescriptionStateSnapshot() {
    if (this._descriptionStateHistory.length === 0) {
      Logger.warn('[AppState] descriptionStateHistory underflow; resetting description tracking');
      this.resetDescriptionTracking();
      return;
    }
    const snap = this._descriptionStateHistory.pop();
    this._descriptionState = cloneDescriptionState(snap);
  }

  /** 新規プレイ開始時に呼ぶ（startNewSession フックからも実行） */
  resetDescriptionTracking() {
    this._descriptionState = {};
    this.clearDescriptionStateHistory();
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
