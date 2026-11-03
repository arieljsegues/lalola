"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { useCart } from "@/app/components/cart/CartProvider";

type MenuItem = {
  id: string;
  name: string;
  ingredients: string;
  price: number;
  category: string;
  allergens: string[] | null;
  image_url: string | null;
};

// Platos destacados en el orden exacto de aparición
const FEATURED_MENU_IDS = [
  "5bbde831-c5b6-49c5-a525-332045a41df9",
  "3c23df32-8f54-4920-8f05-56cb929c9526",
  "92f5e927-29b6-4fd1-bd8b-c14a8595012b",
  "1c5f53b7-4829-4b7f-9e3d-c6de03ca403e",
];

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function MenuSection() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { addItem } = useCart();

  useEffect(() => {
    async function loadMenu() {
      const { data, error } = await supabase
        .from("menu_items")
        .select(
          "id, name, ingredients, price, category, allergens, image_url"
        )
        .eq("is_available", true)
        .in("id", FEATURED_MENU_IDS);

      if (error) {
        console.error("Error al cargar los platos destacados:", error);
        setError(true);
      } else {
        // Asociar cada plato a su ID
        const itemsById = new Map(
          (data ?? []).map((item) => [item.id, item])
        );

        // Reconstruir la lista siguiendo el orden establecido
        const orderedItems = FEATURED_MENU_IDS
          .map((id) => itemsById.get(id))
          .filter((item): item is MenuItem => item !== undefined);

        setItems(orderedItems);
      }

      setLoading(false);
    }

    void loadMenu();
  }, []);

  function handleAddToCart(item: MenuItem) {
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
    });
  }

  return (
    <section id="carta" className="featured-menu">
      <div className="featured-menu__inner">

        <header className="featured-menu__header">
          <p className="featured-menu__eyebrow">
            Els preferits de la Lola
          </p>

          <h2 className="featured-menu__title">
            IMPOSSIBLE ESCOLLIR-NE NOMÉS UN
          </h2>
        </header>

        {loading && (
          <p className="featured-menu__message">
            Carregant els nostres preferits...
          </p>
        )}

        {error && (
          <p className="featured-menu__message" role="alert">
            No s&apos;ha pogut carregar els plats. Intenta-ho de nou més endavant.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="featured-menu__message">
            Estem preparant els nostres preferits. Vine aviat!
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
                      Fotografia properament
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

                  <button
                    type="button"
                    className="featured-card__add-button"
                    onClick={() => handleAddToCart(item)}
                  >
                    <span>Afegir a la cistella</span>
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <a href="#contacto" className="featured-menu__link">
          Se t&apos;ha obert la gana? Troba&apos;ns{" "}
          <span aria-hidden="true">↗</span>
        </a>

        <a href="/lalola/carta" className="featured-menu__link">
          Veure la carta completa{" "}
          <span aria-hidden="true">↗</span>
        </a>

      </div>
    </section>
  );
}