/* Fetches editable content (content/global.json, content/about.json) and patches it into the
   DOM by id, before GSAP/main.js sets up animations. The hardcoded text already in the HTML is
   the fallback: if a fetch fails or times out, the page still renders and animates with it. */
(function () {
  const CONTENT_URLS = {
    global: 'content/global.json',
    about: 'content/about.json',
    home: 'content/home.json',
  };

  function setText(id, value) {
    if (value == null) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHTML(id, value) {
    if (value == null) return;
    const el = document.getElementById(id);
    if (el) el.innerHTML = String(value).replace(/\n/g, '<br>');
  }

  function setAttr(id, attr, value) {
    if (value == null) return;
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  }

  function renderList(id, items, templateFn) {
    if (!Array.isArray(items)) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items.map(templateFn).join('');
  }

  function applyGlobalContent(data) {
    if (!data) return;
    const { header, footer } = data;

    if (header) {
      setAttr('headerLogo', 'src', header.logo);
      if (Array.isArray(header.navLinks)) {
        const nav = document.getElementById('nav');
        const siteHeader = document.querySelector('site-header');
        const activeKey = siteHeader ? siteHeader.getAttribute('active') : '';
        if (nav) {
          nav.innerHTML = header.navLinks.map(link =>
            `<a href="${link.href}"${link.key === activeKey ? ' class="is-active"' : ''}>${link.label}</a>`
          ).join('');
        }
      }
      setAttr('headerCta', 'label', header.ctaText);
      setAttr('headerCta', 'href', header.ctaLink);
    }

    if (footer) {
      setHTML('footerHeading', footer.heading);
      setAttr('footerCta', 'label', footer.ctaText);
      setAttr('footerCta', 'href', footer.ctaLink);
      setText('footerSupportLabel', footer.supportLabel);
      setText('footerSupportValue', footer.supportValue);
      setAttr('footerSupportValue', 'href', footer.supportLink);
      setText('footerEmail', footer.email);
      setAttr('footerEmail', 'href', footer.email ? `mailto:${footer.email}` : null);
      renderList('footerSocialLinks', footer.socialLinks, link =>
        `<a href="${link.url}" class="social-link">${link.label} <span class="social-icon-flip"><img class="social-icon" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"><img class="social-icon social-icon-hover" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"></span></a>`
      );
      setText('footerCompanyName', footer.companyName);
      setText('footerAddress', footer.address);
      setText('footerTaxId', footer.taxId);
      setText('footerFineprint', footer.fineprint);
      setText('footerCopyright', footer.copyright);
      setText('footerTermsLink', footer.termsLabel);
      setAttr('footerTermsLink', 'href', footer.termsLink);
    }
  }

  function applyAboutContent(data) {
    if (!data) return;
    const { hero, miraeAsset, values, awards, disclaimer } = data;

    if (hero) {
      setText('heroTitle', hero.title);
      setText('heroDesc', hero.description);
      setAttr('heroImage', 'src', hero.image);
      setAttr('heroImage', 'alt', hero.imageAlt);
    }

    if (miraeAsset) {
      setText('miraeTitle', miraeAsset.title);
      setText('miraeDesc', miraeAsset.description);
      renderList('metricsList', miraeAsset.metrics, m =>
        `<div class="metric"><p class="metric-num">${m.number}</p><p class="metric-label">${m.label}</p></div>`
      );
    }

    if (values) {
      setText('valuesTitle', values.title);
      renderList('valuesList', values.items, (item, i, arr) => `
        <div class="fact-row${i === arr.length - 1 ? ' fact-row-last' : ''}">
          <div class="icon-wrap"><img src="${item.icon}" alt="" width="28" height="28"></div>
          <div class="fact-text">
            <p class="fact-title">${item.title}</p>
            <p class="fact-desc">${item.description}</p>
          </div>
        </div>
      `);
    }

    if (awards) {
      setText('awardsTitle', awards.title);
      renderList('awardsTrack', awards.items, item => `
        <div class="award-card" style="background-image:url('${item.image}')">
          <p class="award-year">${item.year}</p>
          <p class="award-desc">${String(item.description).replace(/\n/g, '<br>')}</p>
        </div>
      `);
    }

    if (disclaimer) {
      setText('disclaimerText', disclaimer.text);
      renderList('disclaimerLinks', disclaimer.links, link => `<a href="${link.url}">${link.label}</a>`);
    }
  }

  function applyHomeContent(data) {
    if (!data) return;
    const { hero, cvp, calculator, trusted, guide, banner, faq } = data;

    if (hero) {
      setText('heroHomeTitleGreen', hero.titleGreen);
      setText('heroHomeTitleDark', hero.titleDark);
      renderList('heroHomeHighlights', hero.highlights, h =>
        `<li><img src="assets/img/home/check-circle.svg" alt="" width="20" height="20"><span>${h.before || ''}<b>${h.highlight}</b>${h.after || ''}</span></li>`
      );
      setAttr('heroHomeCta', 'label', hero.ctaText);
      setAttr('heroHomeCta', 'href', hero.ctaLink);
      setText('heroHomeDisclaimer', hero.disclaimer);
    }

    if (cvp) {
      setText('cvpEyebrow', cvp.eyebrow);
      setHTML('cvpTitle', [cvp.titleLine1, cvp.titleLine2].filter(Boolean).join('\n'));
      renderList('cvpList', cvp.items, item =>
        `<div class="cvp-card"><div class="cvp-icon" style="background:${item.bg}"><img src="${item.icon}" alt=""></div><p>${item.text}</p></div>`
      );
    }

    if (calculator) {
      setText('calcLabel', calculator.label);
      setText('calcPeriodLabel', calculator.periodLabel);
      setText('calcRateRange', calculator.rateRangeText);
      setText('calcCaption', calculator.caption);
      renderList('calcDisclaimer', calculator.disclaimer, p => `<p>${p}</p>`);
      if (Array.isArray(calculator.periods)) {
        renderList('calcChips', calculator.periods, months => {
          const isPopular = months === calculator.popularPeriod;
          const isSelected = months === calculator.defaultPeriod;
          return `<button class="calc-chip${isSelected ? ' is-selected' : ''}" data-months="${months}">${months} tháng${isPopular ? ' (Phổ biến) <span aria-hidden="true">⭐</span>' : ''}</button>`;
        });
      }
      // Calculator amounts/rate feed js/home.js's live math, not just static text — dispatch
      // an event rather than reaching into home.js's closed-over state directly.
      document.dispatchEvent(new CustomEvent('calculator-config', { detail: calculator }));
    }

    if (trusted) {
      setHTML('trustedTitle', [trusted.titleLine1, trusted.titleLine2].filter(Boolean).join('\n'));
      renderList('trustedList', trusted.items, item =>
        `<div class="trusted-card"><div class="trusted-emoji">${item.emoji}</div><p>${item.text}</p></div>`
      );
      setAttr('trustedCta', 'label', trusted.ctaText);
      setAttr('trustedCta', 'href', trusted.ctaLink);
    }

    if (guide) {
      setHTML('guideTitle', [guide.titleLine1, guide.titleLine2].filter(Boolean).join('\n'));
      renderList('guideSteps', guide.steps, (step, i) => `
        <li${i === 0 ? ' class="is-active"' : ''}>
          <span class="guide-point">${i + 1}</span>
          <div class="guide-step-content">
            <p class="guide-step-title">${step.title}</p>
            <p class="guide-step-desc">${step.desc}</p>
          </div>
        </li>
      `);
    }

    if (banner) {
      setText('bannerSubtitle', banner.subtitle);
      setHTML('bannerTitle', banner.title);
      setAttr('bannerCta', 'label', banner.ctaText);
      setAttr('bannerCta', 'href', banner.ctaLink);
    }

    if (faq) {
      setText('faqTitle', faq.title);
      renderList('faqList', faq.items, (item, i) => `
        <div class="faq-item${i === 0 ? ' is-open' : ''}">
          <button class="faq-question"><span>${item.question}</span><img class="faq-icon" src="assets/img/home/faq-add.svg" alt=""></button>
          <p class="faq-answer">${item.answer}</p>
        </div>
      `);
      setAttr('faqCta', 'label', faq.ctaText);
      setAttr('faqCta', 'href', faq.ctaLink);
    }
  }

  function fetchJSON(url) {
    return fetch(url).then(res => {
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      return res.json();
    });
  }

  // window.contentReady must be a real Promise the instant this script finishes executing —
  // main.js/home.js read it synchronously at the bottom of <body> ("window.contentReady ||
  // Promise.resolve()") and fall back to an already-resolved promise if it's still undefined
  // at that point, which would skip waiting for content entirely. Since this script sits in
  // <head> and runs before <body> (and its data-page attribute) exists, the Promise itself is
  // created synchronously here, but the work inside it — which needs document.body — is
  // deferred to DOMContentLoaded internally.
  window.contentReady = new Promise(resolveContentReady => {
    function start() {
      // Which page-specific content file to fetch — set via <body data-page="about|home"> so
      // this file stays generic instead of hardcoding one page's content into every fetch list.
      const page = document.body.dataset.page;
      const pageFetchers = {
        about: () => fetchJSON(CONTENT_URLS.about).then(applyAboutContent)
          .catch(err => console.warn('[content-loader] about.json failed, keeping fallback content:', err)),
        home: () => fetchJSON(CONTENT_URLS.home).then(applyHomeContent)
          .catch(err => console.warn('[content-loader] home.json failed, keeping fallback content:', err)),
      };

      const loaded = Promise.all([
        fetchJSON(CONTENT_URLS.global).then(applyGlobalContent)
          .catch(err => console.warn('[content-loader] global.json failed, keeping fallback content:', err)),
        pageFetchers[page] ? pageFetchers[page]() : Promise.resolve(),
      ]);

      // Safety timeout: animations must still start even if the fetch hangs or is very slow.
      const timeout = new Promise(resolve => setTimeout(resolve, 2000));

      Promise.race([loaded, timeout]).then(resolveContentReady);
    }

    if (document.body) {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start);
    }
  });
})();
