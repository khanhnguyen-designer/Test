/* Reusable CTA button — <cta-button variant="dark|gradient" kind="page|link" href="..." label="...">
   Renders the .btn markup + the per-character staggered flip-up hover (same mechanic as
   seasats.com's nav: each character slides up/out independently with an increasing delay,
   instead of the whole label sliding as one block).

   Attributes:
   - variant: "dark" | "gradient" — maps to .btn-dark / .btn-gradient
   - kind: "page" (internal navigation, same tab) | "link" (external, opens in a new tab)
   - href / label: can be set as attributes up front, or updated later via setAttribute —
     both are observed and re-render live (content-loader.js patches these post-load). */
class CtaButton extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'label'];
  }

  connectedCallback() {
    if (this._anchor) return;

    const variant = this.getAttribute('variant') || 'dark';
    const kind = this.getAttribute('kind') || 'page';
    const href = this.getAttribute('href') || '#';
    const initialLabel = this.getAttribute('label') || this.textContent.trim();

    this.textContent = '';
    const a = document.createElement('a');
    a.className = `btn btn-${variant}`;
    a.href = href;
    if (kind === 'link') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.innerHTML =
      '<span class="btn-label"><span class="btn-label-original"></span><span class="btn-label-copy"></span></span>';

    this._anchor = a;
    this._originalEl = a.querySelector('.btn-label-original');
    this._copyEl = a.querySelector('.btn-label-copy');
    this.appendChild(a);

    this._setLabel(initialLabel);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._anchor || oldValue === newValue) return;
    if (name === 'href') this._anchor.href = newValue;
    if (name === 'label') this._setLabel(newValue);
  }

  _setLabel(text) {
    if (text == null) return;
    const chars = [...text];
    const amt = chars.length;
    const build = () =>
      chars.map((c, i) => {
        const span = document.createElement('span');
        span.className = 'btn-char';
        span.style.setProperty('--char-index', i);
        span.style.setProperty('--char-amt', amt);
        span.textContent = c;
        return span;
      });
    this._originalEl.replaceChildren(...build());
    this._copyEl.replaceChildren(...build());
  }
}

customElements.define('cta-button', CtaButton);
