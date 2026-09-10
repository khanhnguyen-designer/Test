/* Home page (index.html) interactivity: loan calculator (slider + period chips) and the FAQ
   accordion. Kept separate from main.js, which is about.html-only animation logic. */
(function () {
  // content-loader.js dispatches this as soon as content/home.json's "calculator" block is
  // applied — which happens before window.contentReady resolves, i.e. before initHomePage runs
  // below. Listening here (top-level, registered the instant this script parses) rather than
  // inside initHomePage is what guarantees the event isn't missed.
  let calculatorConfig = null;
  document.addEventListener('calculator-config', e => { calculatorConfig = e.detail; });

  function initHomePage() {
    /* ---------- FAQ accordion (single-open) ---------- */
    const faqItems = [...document.querySelectorAll('.faq-item')];
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        faqItems.forEach(other => other.classList.remove('is-open'));
        if (willOpen) item.classList.add('is-open');
      });
    });

    /* ---------- Loan calculator ----------
       Flat-rate-on-original-principal model ("lãi suất tính trên dư nợ gốc", explicitly the
       model named in the page copy): monthly payment = principal/months + principal*rate/12.
       ANNUAL_RATE_PERCENT (21%) is the illustrative rate the design copy itself cites for the
       calculator's example — not a verified real underwriting rate. Flag this to whoever owns
       the actual lending terms before treating the output as more than illustrative. */
    const ANNUAL_RATE_PERCENT = calculatorConfig ? calculatorConfig.annualRatePercent : 21;
    const MIN_AMOUNT = calculatorConfig ? calculatorConfig.minAmount : 5000000;
    const MAX_AMOUNT = calculatorConfig ? calculatorConfig.maxAmount : 70000000;
    const AMOUNT_STEP = 1000000;

    const slider = document.getElementById('calcSlider');
    const thumb = document.getElementById('calcSliderThumb');
    const fill = document.getElementById('calcSliderFill');
    const amountDisplay = document.getElementById('calcAmountDisplay');
    const chips = [...document.querySelectorAll('.calc-chip')];
    const monthlyPaymentEl = document.getElementById('calcMonthlyPayment');

    if (!slider) return; // calculator not on this page

    let amount = calculatorConfig ? calculatorConfig.defaultAmount : 20000000;
    let months = calculatorConfig ? calculatorConfig.defaultPeriod : 24;

    function formatVnd(value) {
      return Math.round(value).toLocaleString('vi-VN') + 'đ';
    }

    function computeMonthlyPayment() {
      return amount / months + (amount * ANNUAL_RATE_PERCENT) / 100 / 12;
    }

    function render() {
      const progress = (amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT);
      thumb.style.left = `${progress * 100}%`;
      fill.style.width = `${progress * 100}%`;
      amountDisplay.textContent = formatVnd(amount);
      thumb.setAttribute('aria-valuenow', String(Math.round(amount)));
      monthlyPaymentEl.textContent = formatVnd(computeMonthlyPayment());
    }

    function setAmountFromRatio(ratio) {
      const raw = MIN_AMOUNT + ratio * (MAX_AMOUNT - MIN_AMOUNT);
      const stepped = Math.round(raw / AMOUNT_STEP) * AMOUNT_STEP;
      amount = Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, stepped));
      render();
    }

    function ratioFromClientX(clientX) {
      const rect = slider.getBoundingClientRect();
      return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    }

    let dragging = false;
    thumb.addEventListener('pointerdown', e => {
      dragging = true;
      thumb.setPointerCapture(e.pointerId);
    });
    thumb.addEventListener('pointermove', e => {
      if (!dragging) return;
      setAmountFromRatio(ratioFromClientX(e.clientX));
    });
    ['pointerup', 'pointercancel'].forEach(evt =>
      thumb.addEventListener(evt, () => { dragging = false; })
    );
    slider.addEventListener('pointerdown', e => {
      if (e.target === thumb) return;
      setAmountFromRatio(ratioFromClientX(e.clientX));
    });
    thumb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        amount = Math.min(MAX_AMOUNT, amount + AMOUNT_STEP);
        render();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        amount = Math.max(MIN_AMOUNT, amount - AMOUNT_STEP);
        render();
      }
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
        months = Number(chip.dataset.months);
        render();
      });
    });

    render();

    /* ---------- Section heading blur-in reveal, once per heading on scroll ----------
       Same pattern as about.html's headings (js/main.js), reused here rather than shared to
       keep this file self-contained — see main.js for the fuller write-up of why the split
       must wait on document.fonts.ready. */
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      function splitIntoLines(el) {
        // Unlike about.html's headings (plain strings, wrapped only by width), these titles
        // (cvpTitle, trustedTitle, ...) carry a deliberate manual <br> between their 2 lines.
        // el.textContent alone discards element boundaries, so "khoản<br>Đăng" would collapse
        // to "khoảnĐăng" with no space — replace <br> with a marker word first so it survives
        // into the word list, then force a line break wherever that marker lands (still
        // measuring offsetTop within each <br>-delimited segment, in case it wraps further).
        const BREAK = '';
        el.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, ` ${BREAK} `);
        const words = el.textContent.trim().split(/\s+/).filter(Boolean);
        el.innerHTML = words.map(w => `<span class="line-word">${w}</span>`).join(' ');
        const wordEls = [...el.querySelectorAll('.line-word')];

        const lines = [];
        let currentTop = null;
        let currentWords = [];
        wordEls.forEach(w => {
          if (w.textContent === BREAK) {
            if (currentWords.length) lines.push(currentWords);
            currentWords = [];
            currentTop = null;
            return;
          }
          const top = w.offsetTop;
          if (currentTop === null || Math.abs(top - currentTop) < 2) {
            currentWords.push(w.textContent);
          } else {
            lines.push(currentWords);
            currentWords = [w.textContent];
          }
          currentTop = top;
        });
        if (currentWords.length) lines.push(currentWords);

        el.innerHTML = lines.map(lineWords => `<span class="blur-line">${lineWords.join(' ')}</span>`).join('');
        return el.querySelectorAll('.blur-line');
      }

      const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      fontsReady.then(() => {
        ['cvpTitle', 'trustedTitle', 'guideTitle', 'bannerTitle', 'faqTitle'].forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          const lines = splitIntoLines(el);
          gsap.set(lines, { opacity: 0, filter: 'blur(16px)', y: 14 });
          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.to(lines, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.15 });
            },
          });
        });
      });

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.header', { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6 }, 0)
        .fromTo('.hero-home-content', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, 0.15)
        .fromTo('.hero-home-visual', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.9 }, 0.3);
    }
  }

  (window.contentReady || Promise.resolve()).then(initHomePage);
})();
