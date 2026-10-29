
"use client";

import { useState } from "react";

const photos = [
  {
    src: "/images/nosotros-1.webp",
    alt: "Juanjo y Lola en su restaurante",
    label: "Una historia de familia",
  },
  {
    src: "/images/nosotros-2.webp",
    alt: "Preparación artesanal de nuestros platos",
    label: "Pasión por la cocina",
  },
  {
    src: "/images/nosotros-3.webp",
    alt: "Ingredientes frescos preparados en cocina",
    label: "Cuidamos cada detalle",
  },
  {
    src: "/images/nosotros-4.webp",
    alt: "Un plato recién preparado para nuestros clientes",
    label: "Momentos para compartir",
  },
];

export default function AboutSection() {
  const [active, setActive] = useState(0);

  const previous = () => {
    setActive((current) =>
      current === 0 ? photos.length - 1 : current - 1
    );
  };

  const next = () => {
    setActive((current) => (current + 1) % photos.length);
  };

  return (
    <section id="nosotros" className="about">
      <div className="about__inner">
        <div className="about__copy">
          <p className="about__eyebrow">Detrás de cada plato</p>

          <h2 className="about__title">
            Una historia de
            <br />
            <span>esfuerzo y pasión.</span>
          </h2>

          <div className="about__story">
            <p>
              Somos Lola Y Juanjo. Abrimos nuestro restaurante en
              La Seu con mucha ilusión, sin imaginar que, justo
              antes de la pandemia, nos tocaría afrontar uno de los
              mayores retos de nuestras vidas.
            </p>

            <p>
              Pero nunca dejamos de creer en lo que estábamos
              construyendo. Con trabajo diario, esfuerzo y pasión
              por la cocina, hemos seguido adelante, poniendo
              nuestro corazón en cada plato y en cada persona que
              confía en nosotros.
            </p>
          </div>

          <p className="about__signature">
            Lola y Juanjo <span>·</span> La Seu d'Urgell
          </p>
        </div>

        <div className="about__visual">
          <div className="about__carousel">
            {photos.map((photo, index) => (
              <div
                key={photo.src}
                className={`about__slide ${
                  active === index ? "is-active" : ""
                }`}
                aria-hidden={active !== index}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="about__image"
                />

                <div className="about__image-caption">
                  <span>LOLA & JUANJO</span>
                  <p>{photo.label}</p>
                </div>
              </div>
            ))}

            <div className="about__controls">
              <div className="about__dots" aria-label="Seleccionar fotografía">
                {photos.map((photo, index) => (
                  <button
                    key={photo.src}
                    type="button"
                    className={`about__dot ${
                      active === index ? "is-active" : ""
                    }`}
                    onClick={() => setActive(index)}
                    aria-label={`Ver fotografía ${index + 1}`}
                    aria-pressed={active === index}
                  />
                ))}
              </div>

              <div className="about__arrows">
                <button
                  type="button"
                  onClick={previous}
                  className="about__arrow"
                  aria-label="Fotografía anterior"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={next}
                  className="about__arrow"
                  aria-label="Fotografía siguiente"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
