/**
 * markdown.js — Marked.js + Highlight.js 래퍼
 * 마크다운 파일을 fetch하여 HTML로 렌더링합니다.
 */

(function () {
  'use strict';

  // Configure marked
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      highlight: function (code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (_) {}
        }
        return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
      },
      breaks: true,
      gfm: true,
    });
  }

  /**
   * 마크다운 파일을 fetch & 렌더링
   * @param {string} filePath - 마크다운 파일 경로
   * @param {HTMLElement} container - 렌더링할 컨테이너
   */
  async function renderMarkdown(filePath, container) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const html = typeof marked !== 'undefined' ? marked.parse(text) : `<pre>${text}</pre>`;
      container.innerHTML = html;

      // Apply hljs to code blocks
      if (typeof hljs !== 'undefined') {
        container.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    } catch (err) {
      container.innerHTML = `
        <div style="color: var(--accent-pink); padding: 20px; border: 1px solid rgba(236,72,153,0.3); border-radius: 8px;">
          <strong>⚠️ 포스트를 불러올 수 없습니다.</strong><br/>
          <small style="color: var(--text-muted);">${err.message}</small><br/>
          <small style="color: var(--text-muted); margin-top:8px; display:block;">
            💡 로컬에서는 Python 서버를 실행하세요:<br/>
            <code style="color:var(--accent-cyan)">python -m http.server 8080</code>
          </small>
        </div>
      `;
    }
  }

  // Expose globally
  window.MarkdownRenderer = { renderMarkdown };
})();
