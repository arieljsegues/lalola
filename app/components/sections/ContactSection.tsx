
const contactDetails = [

  {
    title: "Horario",
    value: "De miércoles a domingo",
    extra: "20:00 – 23:00",
  },
  {
    title: "Reservas",
    value: "+34 648 80 41 05",
  },
];

const mapUrl =
  "https://www.google.com/maps?q=Carrer%20de%20Lloren%C3%A7%20Tom%C3%A0s%20i%20Costa%2C%208%2C%2025700%20La%20Seu%20d%27Urgell%2C%20Lleida&output=embed";


const directionsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=Restaurant%20La%20Lola%20Pizzeria%2C%20La%20Seu%20d%27Urgell%2C%20Lleida";

export default function ContactSection() {
  return (
    <section id="contacto" className="contact">
      <div className="contact__inner">
        <div className="contact__header">
          <p className="contact__eyebrow">Estamos aquí</p>

          <h2 className="contact__title">Ven a vernos</h2>

        </div>

        <div className="contact__content">
          <div className="contact__info">
            <div className="contact__details">
              {contactDetails.map((detail) => (
                <div className="contact__detail" key={detail.title}>
                  <h3 className="contact__detail-title">
                    {detail.title}
                  </h3>

                  {detail.title === "Reservas" ? (
                    <a
                      href="tel:+34648804105"
                      className="contact__detail-value contact__phone"
                    >
                      {detail.value}
                    </a>
                  ) : (
                    <p className="contact__detail-value">
                      {detail.value}
                    </p>
                  )}

                  <p className="contact__detail-extra">
                    {detail.extra}
                  </p>
                </div>
              ))}
            </div>

            <div className="contact__actions">
              <a
                href="tel:+34648804105"
                className="contact__button contact__button--primary"
              >
                Llámanos para reservar
              </a>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact__button contact__button--secondary"
              >
                Cómo llegar ↗
              </a>
            </div>
          </div>

          <div className="contact__map">
            <iframe
            title="Ubicación de La Lola Pizzeria"
            src={mapUrl}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
