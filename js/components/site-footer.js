class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="footer">
        <div class="footer-row">
          <div class="footer-cta">
            <div class="footer-cta-inner">
              <h2 class="footer-heading" id="footerHeading">Vay khoản lớn<br>Lãi thật nhỏ</h2>
              <a href="#" class="btn btn-gradient" id="footerCta">
                <span class="flip-content">
                  <span class="flip-text" data-flip-text>Đăng ký ngay</span>
                  <span class="flip-text flip-text-hover" data-flip-text>Đăng ký ngay</span>
                </span>
              </a>
            </div>
          </div>

          <div class="footer-content">
            <div class="footer-info-block">
              <div class="footer-info-group">
                <div class="footer-info-wrap">
                  <div class="footer-info">
                    <p class="footer-label" id="footerSupportLabel">Hỗ trợ trực tuyến</p>
                    <a class="footer-value footer-support-link" id="footerSupportValue" href="#">Zalo OA: EVO Vietnam</a>
                  </div>
                  <div class="footer-info">
                    <p class="footer-label">Email</p>
                    <a class="footer-value footer-email-link" id="footerEmail" href="mailto:hotro@evomoney.vn">hotro@evomoney.vn</a>
                  </div>
                </div>

                <div class="footer-info">
                  <p class="footer-label">Social</p>
                  <div class="social-links" id="footerSocialLinks">
                    <a href="#" class="social-link">Facebook <span class="social-icon-flip"><img class="social-icon" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"><img class="social-icon social-icon-hover" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"></span></a>
                    <a href="#" class="social-link">Youtube <span class="social-icon-flip"><img class="social-icon" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"><img class="social-icon social-icon-hover" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"></span></a>
                    <a href="#" class="social-link">Linkedin <span class="social-icon-flip"><img class="social-icon" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"><img class="social-icon social-icon-hover" src="assets/img/arrow-outward.svg" alt="" width="20" height="20"></span></a>
                  </div>
                </div>
              </div>

              <div class="footer-info footer-contact">
                <p class="footer-label">Liên hệ</p>
                <p class="footer-value" id="footerCompanyName">CÔNG TY CỔ PHẦN TRUSTING SOCIAL</p>
                <p class="footer-value" id="footerAddress">Tầng 8 Toà nhà Havana, 132 Hàm Nghi, Phường Bến Thành, thành phố Hồ Chí Minh, Việt Nam</p>
                <p class="footer-value" id="footerTaxId">MST: 0106957913</p>
              </div>
            </div>

            <p class="footer-fineprint" id="footerFineprint">EVO Money là nền tảng tài chính minh bạch cho Khách hàng cá nhân do Trusting Social phát triển và sở hữu. Các khoản vay tiền mặt trên nền tảng EVO Money được cung cấp bởi Công ty Tài chính TNHH MTV Mirae Asset (Việt Nam).</p>
          </div>

          <div class="footer-logo-deco" id="footerLogoLottie" aria-hidden="true"></div>
        </div>

        <div class="footer-bottom">
          <p id="footerCopyright">© 2026 EVO Money. All rights reserved</p>
          <a href="#" id="footerTermsLink">Điều Khoản và Điều Kiện</a>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);
