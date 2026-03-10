/**
 * HTML Utilities - XSS Prevention
 * Centralized utilities for safe HTML handling and escaping
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * Converts: < > & " '
 * @param {any} text - Text to escape (null/undefined return empty string)
 * @returns {string} Escaped text safe for use in HTML
 */
export function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a text node safely without using innerHTML
 * @param {string} text - Text content
 * @returns {Text} DOM text node
 */
export function createTextNode(text) {
  return document.createTextNode(text);
}

/**
 * Creates an element with text content safely
 * @param {string} tagName - HTML tag name
 * @param {string} textContent - Text content (not HTML)
 * @param {Object} attributes - Optional attributes object
 * @returns {HTMLElement} Element with text content
 */
export function createElement(tagName, textContent = '', attributes = {}) {
  const element = document.createElement(tagName);
  if (textContent) {
    element.textContent = textContent;
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'class') {
      element.className = value;
    } else if (key === 'style') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, String(value));
    }
  });
  return element;
}

/**
 * Safely sets element content from text (not HTML)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content
 */
export function setTextContent(element, text) {
  if (!element) return;
  element.textContent = text;
}

/**
 * Safely clears element content
 * @param {HTMLElement} element - Element to clear
 */
export function clearContent(element) {
  if (!element) return;
  element.textContent = '';
}

/**
 * Creates a safe list item with text
 * @param {string} text - List item text
 * @returns {HTMLLIElement} List item element
 */
export function createListItem(text) {
  const li = document.createElement('li');
  li.textContent = text;
  return li;
}

/**
 * Creates a safe div with text
 * @param {string} text - Div text content
 * @param {string} className - Optional CSS class
 * @returns {HTMLDivElement} Div element
 */
export function createDiv(text = '', className = '') {
  const div = document.createElement('div');
  if (text) div.textContent = text;
  if (className) div.className = className;
  return div;
}

/**
 * Creates a safe span with text
 * @param {string} text - Span text content
 * @param {string} className - Optional CSS class
 * @returns {HTMLSpanElement} Span element
 */
export function createSpan(text = '', className = '') {
  const span = document.createElement('span');
  if (text) span.textContent = text;
  if (className) span.className = className;
  return span;
}
