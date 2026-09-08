const NAV_LINKS = [
  { key: 'home', label: 'Trang chủ', href: 'index.html' },
  { key: 'about', label: 'Về chúng tôi', href: 'about.html' },
  { key: 'news', label: 'Tin tức', href: '#' },
  { key: 'faq', label: 'Câu hỏi thường gặp', href: '#' },
  { key: 'contact', label: 'Liên hệ', href: '#' },
];

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || '';

    const navHtml = NAV_LINKS.map(link =>
      `<a href="${link.href}"${link.key === active ? ' class="is-active"' : ''}>${link.label}</a>`
    ).join('');

    this.innerHTML = `
      <header class="header">
        <a href="index.html" class="logo">
          <img src="assets/img/logo-header.svg" alt="EVO Money" width="53" height="24" id="headerLogo">
        </a>

        <nav class="nav" id="nav">
          ${navHtml}
        </nav>

        <a href="#" class="btn btn-dark header-cta" id="headerCta">Đăng ký</a>

        <button class="burger" id="burger" aria-label="Mở menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </header>
    `;
  }
}

customElements.define('site-header', SiteHeader);
