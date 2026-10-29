
export default function Hero() {
  return (
    <section id="inicio" className="hero">
        
        <img
        src="/images/logo.png"
        alt="La Lola"
        className="hero__logo"
        />

      <div className="hero__inner">
        <p className="hero__eyebrow">
          Hecho para disfrutar
        </p>

        <h1 className="hero__title">
          Pizza, Burgers
          <br />
          <span className="hero__title-accent">
            y mucho más
          </span>
        </h1>

        <p className="hero__description">
          Tus favoritos, recién hechos y listos para disfrutar.
        </p>

        <div className="hero__actions">
         {/* <a href="#carta" className="button button--primary">
            Haz tu pedido <span aria-hidden="true">→</span>
          </a> 

          <a href="/carta" className="button button--outline">
            Ver la carta <span aria-hidden="true">→</span>
          </a>*/}

          <a href="/carta" className="button button--primary">
            Ver la carta <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <a
        href="#carta"
        className="hero__scroll"
        aria-label="Desplazarse hasta la carta"
      >
        <span className="hero__scroll-label">Descubre</span>
        <span className="hero__scroll-arrow" aria-hidden="true">
          ↓
        </span>
      </a>
    </section>
  );
}
