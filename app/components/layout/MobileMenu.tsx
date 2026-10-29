
"use client";

import { useState } from "react";

type MenuLink = {
  label: string;
  href: string;
};

export default function MobileMenu({
  links,
}: {
  links: MenuLink[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="mobile-menu__toggle"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="mobile-menu__line" />
        <span className="mobile-menu__line" />
        <span className="mobile-menu__line" />
      </button>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-menu__panel"
          aria-label="Navegación móvil"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mobile-menu__link"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <a
            href="/lalola/carta"
            className="button button--primary mobile-menu__order"
            onClick={() => setIsOpen(false)}
          >
            Ver toda la carta →
          </a>
        </nav>
      )}
    </div>
  );
}
