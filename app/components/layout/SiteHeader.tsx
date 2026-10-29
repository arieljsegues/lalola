"use client";

import { useEffect, useState } from "react";
import MobileMenu from "./MobileMenu";

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Carta", href: "#carta" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
];

export default function SiteHeader() {
  const [activeSection, setActiveSection] = useState("#inicio");

  useEffect(() => {
    const sections = links
      .map((link) => document.querySelector(link.href))
      .filter((section): section is Element => section !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visibleSections.length > 0) {
          setActiveSection(`#${visibleSections[0].target.id}`);
        }
      },
      {
        // Detecta la sección en una franja bajo el encabezado.
        rootMargin: "-20% 0px -65% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));

    // Si la página se abre con un enlace hash, respétalo.
    const hash = window.location.hash;
    if (links.some((link) => link.href === hash)) {
      setActiveSection(hash);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a
          href="#inicio"
          className="site-header__logo"
          aria-label="Ir al inicio"
          onClick={() => setActiveSection("#inicio")}
        >

          <span className="site-header__logo-accent">

          </span>
        </a>

        <nav
          className="site-header__nav"
          aria-label="Navegación principal"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`site-header__link${
                activeSection === link.href
                  ? " site-header__link--active"
                  : ""
              }`}
              aria-current={
                activeSection === link.href ? "location" : undefined
              }
              onClick={() => setActiveSection(link.href)}
            >
              {link.label}
            </a>
          ))}
        </nav>



        <div className="site-header__mobile">
          <MobileMenu links={links} />
        </div>
      </div>
    </header>
  );
}