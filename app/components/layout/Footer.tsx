"use client";

import "../../globals.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer__brand">
        <a href="#inicio" aria-label="La Lola, inicio">
            <img
            src="/lalola/images/logo.png"
            alt="La Lola"
            className="footer__logo"
            />
        </a>
        </div>

        <div className="site-footer__actions">
          <a
            href="https://www.instagram.com/lalolafoodanddrink"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__button site-footer__button--instagram"
            aria-label="Visita nuestro Instagram"
          >
            <svg
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
            </svg>
            Instagram
          </a>

          <a
            href="https://search.google.com/local/writereview?placeid=ChIJD8CoiqvtpRIRI7YPQALTR8s"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__button site-footer__button--review"
          >
            <svg
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z" />
            </svg>
            ¡Deja tu reseña!
          </a>
        </div>

        <div className="site-footer__divider" />

        <div className="site-footer__bottom">
          <p>
            © {currentYear} La Lola. Todos los derechos reservados.
          </p>

          <a href="#inicio" className="site-footer__top">
            Volver arriba ↑
          </a>
        </div>
      </div>
    </footer>
  );
}