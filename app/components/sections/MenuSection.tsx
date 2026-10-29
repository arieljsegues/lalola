
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";

type MenuItem = {
  id: string;
  name: string;
  ingredients: string;
  price: number;
  category: string;
  allergens: string[] | null;
  image_url: string | null;
};

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function MenuSection() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      const { data, error } = await supabase
        .from("menu_items")
        .select(
          "id, name, ingredients, price, category, allergens, image_url"
        )
        .eq("is_available", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(4);

      if (error) {
        console.error("Error al cargar los platos destacados:", error);
        setError(true);
      } else {
        setItems((data ?? []) as MenuItem[]);
      }

      setLoading(false);
    }

    void loadMenu();
  }, []);

  return (
    <section id="carta" className="featured-menu">
      <div className="featured-menu__inner">
        <header className="featured-menu__header">
          <p className="featured-menu__eyebrow">
            Los favoritos de la Lola
          </p>

          <h2 className="featured-menu__title">
            IMPOSIBLE ELEGIR SOLO UNO
          </h2>

        </header>

        {loading && (
          <p className="featured-menu__message">
            Cargando nuestros favoritos...
          </p>
        )}

        {error && (
          <p className="featured-menu__message" role="alert">
            No se han podido cargar los platos. Inténtalo de nuevo más tarde.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="featured-menu__message">
            Estamos preparando nuestros favoritos. ¡Muy pronto!
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="featured-menu__grid">
            {items.map((item, index) => (
              <article className="featured-card" key={item.id}>
                <div className="featured-card__image-wrap">
                  {item.image_url ? (
                    <img
                      className="featured-card__image"
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="featured-card__image-placeholder">
                      Fotografía próximamente
                    </div>
                  )}

                  <span className="featured-card__number">
                    0{index + 1}
                  </span>
                </div>

                <div className="featured-card__content">
                  <p className="featured-card__category">
                    {item.category}
                  </p>

                  <div className="featured-card__title-row">
                    <h3 className="featured-card__title">
                      {item.name}
                    </h3>

                    <span className="featured-card__price">
                      {euro.format(Number(item.price))}
                    </span>
                  </div>

                  <p className="featured-card__ingredients">
                    {item.ingredients}
                  </p>


                </div>
              </article>
            ))}
          </div>
        )}

            <a href="#contacto" className="featured-menu__link">
            ¿Se te ha abierto el apetito? Encuéntranos <span aria-hidden="true">↗</span>
            </a>
            <a href="/lalola/carta" className="featured-menu__link">
            Ver la carta completa <span aria-hidden="true">↗</span>
            </a>
      </div>
    </section>
  );
}
