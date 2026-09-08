/* Fetches editable content (content/global.json, content/about.json) and patches it into the
   DOM by id, before GSAP/main.js sets up animations. The hardcoded text already in the HTML is
   the fallback: if a fetch fails or times out, the page still renders and animates with it. */
(function () {
  const CONTENT_URLS = {
    global: 'content/global.json',
    about: 'content/about.json',
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

  // For buttons using the flip-up text hover effect: two [data-flip-text] spans hold duplicate
  // copies of the label, so both need updating — overwriting the button's own textContent would
  // wipe out that structure.
  function setFlipText(id, value) {
    if (value == null) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelectorAll('[data-flip-text]').forEach(span => { span.textContent = value; });
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
      setFlipText('headerCta', header.ctaText);
      setAttr('headerCta', 'href', header.ctaLink);
    }

    if (footer) {
      setHTML('footerHeading', footer.heading);
      setFlipText('footerCta', footer.ctaText);
      setAttr('footerCta', 'href', footer.ctaLink);
      setText('footerSupportLabel', footer.supportLabel);
      setText('footerSupportValue', footer.supportValue);
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

  function fetchJSON(url) {
    return fetch(url).then(res => {
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      return res.json();
    });
  }

  const loaded = Promise.all([
    fetchJSON(CONTENT_URLS.global).then(applyGlobalContent)
      .catch(err => console.warn('[content-loader] global.json failed, keeping fallback content:', err)),
    fetchJSON(CONTENT_URLS.about).then(applyAboutContent)
      .catch(err => console.warn('[content-loader] about.json failed, keeping fallback content:', err)),
  ]);

  // Safety timeout: animations must still start even if the fetch hangs or is very slow.
  const timeout = new Promise(resolve => setTimeout(resolve, 2000));

  window.contentReady = Promise.race([loaded, timeout]);
})();
