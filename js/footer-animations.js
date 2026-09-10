/* Footer logo Lottie animation — replays every time the footer scrolls into view. Shared by
   every page that includes <site-footer> (about.html, index.html, ...), since the footer itself
   is the same component everywhere; kept as its own small file rather than duplicated per page
   or baked into main.js (which carries about.html-only animation logic). */
(function () {
  function initFooterLogoAnimation() {
    const footerLogoEl = document.getElementById('footerLogoLottie');
    if (!footerLogoEl || !window.lottie || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

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

  (window.contentReady || Promise.resolve()).then(initFooterLogoAnimation);
})();
