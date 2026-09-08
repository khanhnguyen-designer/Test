/* Everything below runs only after content-loader.js has patched CMS content into the DOM
   (nav links, metrics, values cards, award cards etc. may get fully regenerated) — running
   before that would attach listeners to elements that get replaced, and would capture stale
   count-up targets. See js/content-loader.js for the `contentReady` promise. */
function initSiteAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Mobile nav toggle ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Text "line-split" helper: wraps each word, groups by measured offsetTop into
     per-line spans (adapts to actual wrapping at any width, instead of guessing line breaks).
     Shared by the hero load-in title and the scroll-triggered section headings below. */
  function splitIntoLines(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="line-word">${w}</span>`).join(' ');
    const wordEls = [...el.querySelectorAll('.line-word')];

    const lines = [];
    let currentTop = null;
    let currentWords = [];
    wordEls.forEach(w => {
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

    el.innerHTML = lines
      .map(lineWords => `<span class="blur-line">${lineWords.join(' ')}</span>`)
      .join('');
    return el.querySelectorAll('.blur-line');
  }

  /* Must wait for the Inter webfont to finish loading before measuring offsetTop — splitting
     against fallback-font metrics grouped words onto the wrong lines (each word landed in its
     own group), and since .blur-line is display:block that wrong split became a permanent
     visual line break regardless of how the text later reflowed. */
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  /* ---------- Load-in: header + hero ---------- */
  fontsReady.then(() => {
    const heroTitle = document.getElementById('heroTitle');
    const heroLines = splitIntoLines(heroTitle);
    gsap.set(heroLines, { opacity: 0, filter: 'blur(16px)', y: 14 });

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.header', { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6 }, 0)
      .to(heroLines, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.15 }, 0.15)
      .fromTo('.hero-desc', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, 0.28)
      .fromTo('.hero-image-wrap', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.9 }, 0.4);
  });

  /* ---------- Awards carousel: arrows + draggable track + custom scrollbar ----------
     Pattern follows GSAP's own Draggable/Inertia guidance: while actively dragging, movement
     tracks the pointer 1:1 with NO easing (easing during drag fights the scroll-position math
     and feels laggy/disconnected). Easing is reserved for programmatic jumps: arrow-button
     clicks and clicking the scrollbar track to jump to a position. */
  const track = document.getElementById('awardsTrack');
  const prevBtn = document.getElementById('awardPrev');
  const nextBtn = document.getElementById('awardNext');
  const scrollbar = document.getElementById('awardsScrollbar');
  const thumb = document.getElementById('awardsThumb');
  const fadeLeft = document.getElementById('awardsFadeLeft');
  const fadeRight = document.getElementById('awardsFadeRight');

  function awardsMaxScroll() {
    return track.scrollWidth - track.clientWidth;
  }

  function updateAwardsThumb() {
    const trackWidth = scrollbar.clientWidth;
    const visibleRatio = track.clientWidth / track.scrollWidth;
    const thumbWidth = Math.max(trackWidth * visibleRatio, 32);
    const thumbTravel = trackWidth - thumbWidth;
    const max = awardsMaxScroll();
    const progress = max > 0 ? track.scrollLeft / max : 0;
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${progress * thumbTravel}px)`;
    updateAwardsFade();
  }

  function updateAwardsFade() {
    const max = awardsMaxScroll();
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft >= max - 1;
    fadeLeft.classList.toggle('is-visible', !atStart);
    fadeRight.classList.toggle('is-hidden', atEnd);
  }

  function scrollAwardsBy(dir) {
    const card = track.querySelector('.award-card');
    if (!card) return;
    const step = card.getBoundingClientRect().width + 24;
    const target = Math.max(0, Math.min(awardsMaxScroll(), track.scrollLeft + dir * step));
    gsap.to(track, { scrollLeft: target, duration: 0.6, ease: 'power3.out' });
  }
  prevBtn.addEventListener('click', () => scrollAwardsBy(-1));
  nextBtn.addEventListener('click', () => scrollAwardsBy(1));

  track.addEventListener('scroll', updateAwardsThumb);
  window.addEventListener('resize', updateAwardsThumb);
  updateAwardsThumb();

  function makeDraggable(el, { getStart, onDrag, onDragStart, onDragEnd }) {
    let dragging = false;
    let startX = 0;
    let startValue = 0;

    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => {
      dragging = true;
      startX = e.clientX;
      startValue = getStart();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* no active pointer for this id — safe to ignore */ }
      onDragStart && onDragStart();
    });
    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      onDrag(e.clientX - startX, startValue);
    });
    ['pointerup', 'pointercancel'].forEach(evt =>
      el.addEventListener(evt, () => {
        if (!dragging) return;
        dragging = false;
        onDragEnd && onDragEnd();
      })
    );
  }

  // Drag the cards directly
  makeDraggable(track, {
    getStart: () => track.scrollLeft,
    onDrag: (deltaX, startScroll) => { track.scrollLeft = startScroll - deltaX; },
  });

  // Drag the scrollbar thumb (the gray bar)
  makeDraggable(thumb, {
    getStart: () => {
      const m = /translateX\(([-\d.]+)px\)/.exec(thumb.style.transform);
      return m ? parseFloat(m[1]) : 0;
    },
    onDragStart: () => thumb.classList.add('is-dragging'),
    onDrag: (deltaX, startThumbX) => {
      const thumbTravel = scrollbar.clientWidth - thumb.offsetWidth;
      if (thumbTravel <= 0) return;
      const newThumbX = Math.max(0, Math.min(thumbTravel, startThumbX + deltaX));
      track.scrollLeft = (newThumbX / thumbTravel) * awardsMaxScroll();
    },
    onDragEnd: () => thumb.classList.remove('is-dragging'),
  });

  // Click the empty part of the scrollbar track to jump-scroll there (eased)
  scrollbar.addEventListener('pointerdown', e => {
    if (e.target === thumb) return;
    const rect = scrollbar.getBoundingClientRect();
    const thumbWidth = thumb.offsetWidth;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left - thumbWidth / 2) / (rect.width - thumbWidth)));
    gsap.to(track, { scrollLeft: ratio * awardsMaxScroll(), duration: 0.5, ease: 'power3.out' });
  });

  /* ---------- Section headings: blur-in reveal, staggered by LINE, once per heading on scroll ----------
     Same splitIntoLines/fontsReady as the hero title above — reveal here is scroll-triggered
     (once per heading) instead of firing immediately on load. */
  fontsReady.then(() => {
    ['miraeTitle', 'valuesTitle', 'awardsTitle'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const lines = splitIntoLines(el);
      gsap.set(lines, { opacity: 0, filter: 'blur(16px)', y: 14 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(lines, {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            duration: 0.9,
            ease: 'power2.inOut',
            stagger: 0.15,
          });
        },
      });
    });
  });

  /* ---------- Footer logo Lottie animation — replays every time the footer scrolls into view ---------- */
  const footerLogoEl = document.getElementById('footerLogoLottie');
  if (footerLogoEl && window.lottie) {
    const footerLogoAnim = lottie.loadAnimation({
      container: footerLogoEl,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: 'assets/lottie/footer-logo.json',
    });

    ScrollTrigger.create({
      trigger: '.footer',
      start: 'top 75%',
      onEnter: () => footerLogoAnim.goToAndPlay(0, true),
      onEnterBack: () => footerLogoAnim.goToAndPlay(0, true),
    });
  }
}

(window.contentReady || Promise.resolve()).then(initSiteAnimations);
