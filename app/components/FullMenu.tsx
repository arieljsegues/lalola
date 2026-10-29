
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/app/lib/supabase/client";

type MenuItem = {
  id: string;
  name: string;
  ingredients: string;
  price: number;
  category: string;
  allergens: string[] | null;
  is_available: boolean;
  sort_order: number;
  subcategory: string | null;
  is_featured: boolean;
  image_url: string | null;
};

type MenuGroup = {
  name: string;
  id: string;
  items: MenuItem[];
};

type MenuCategory = {
  name: string;
  id: string;
  subcategories: MenuGroup[];
  items: MenuItem[];
};

const CATEGORY_ORDER = [
  "per compartir",
  "amanides",
  "burger",
  "pizza",
  "torrades",
  "postres",
  "begudes",
];



const CATEGORY_COMMENTS: Record<string, string> = {
  pizza: "Pizzes al form de pedra fetes al moment.",
};

const SUBCATEGORY_COMMENTS: Record<string, string> = {
  "burger-veggie": "Tots els ingredients vegetals són ecològics, de proximitat i d'alta qualitat. Fes Veggie qualsevol burger nostra de vedella.",
  "burger-vedella":
    "Smash burguers fetes amb carn de vedella 100% picada a casa. Inclou ració de patates casolanes. Tot fet al moment. Fes-la doble (+3.00€)",
    
    "burger-pollastre": "Hamburguesa de cuixa de pollastre de granja Cal Guiu amb arrebossat cruixent cassolà. Fes-la doble(+2.00€)"
};



function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("ca");
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function compareCategories(a: string, b: string) {
  const indexA = CATEGORY_ORDER.indexOf(normalize(a));
  const indexB = CATEGORY_ORDER.indexOf(normalize(b));

  if (indexA === -1 && indexB === -1) {
    return a.localeCompare(b, "ca");
  }

  if (indexA === -1) return 1;
  if (indexB === -1) return -1;

  return indexA - indexB;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export default function FullMenu() {
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("");

  const categories = useMemo<MenuCategory[]>(() => {
    const categoryNames = [
      ...new Set(
        items
          .map((item) => item.category?.trim())
          .filter((name): name is string => Boolean(name))
      ),
    ].sort(compareCategories);

    return categoryNames.map((name) => {
      const categoryItems = items
        .filter(
          (item) => normalize(item.category) === normalize(name)
        )
        .sort((a, b) => a.sort_order - b.sort_order);

      const subcategoryNames = [
        ...new Set(
          categoryItems
            .map((item) => item.subcategory?.trim())
            .filter((value): value is string => Boolean(value))
        ),
      ].sort((a, b) => a.localeCompare(b, "ca"));

      const subcategories = subcategoryNames.map((subcategory) => ({
        name: subcategory,
        id: `${slugify(name)}-${slugify(subcategory)}`,
        items: categoryItems.filter(
          (item) =>
            normalize(item.subcategory ?? "") === normalize(subcategory)
        ),
      }));

      return {
        name,
        id: `categoria-${slugify(name)}`,
        subcategories,
        items: categoryItems,
      };
    });
  }, [items]);

  const currentCategory = categories.find(
    (category) => category.id === activeCategory
  );

    useEffect(() => {
    if (!currentCategory?.subcategories.length) {
        setActiveSubcategory("");
        return;
    }

    const elements = currentCategory.subcategories
        .map((subcategory) => document.getElementById(subcategory.id))
        .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
        (entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
            (a, b) =>
                a.boundingClientRect.top - b.boundingClientRect.top
            );

        if (visible.length > 0) {
            setActiveSubcategory(visible[0].target.id);
        }
        },
        {
        rootMargin: "-180px 0px -60% 0px",
        threshold: 0,
        }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
    }, [currentCategory]);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("menu_items")
        .select(
          "id, name, ingredients, price, category, allergens, is_available, sort_order, subcategory, is_featured, image_url"
        )
        .eq("is_available", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (queryError) {
        setError("No hemos podido cargar la carta. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      const loadedItems = (data ?? []) as MenuItem[];
      setItems(loadedItems);

      const firstCategory = [...new Set(
        loadedItems
          .map((item) => item.category?.trim())
          .filter((name): name is string => Boolean(name))
      )].sort(compareCategories)[0];

      if (firstCategory) {
        setActiveCategory(`categoria-${slugify(firstCategory)}`);
      }

      setLoading(false);
    }

    void loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!categories.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible.length > 0) {
          setActiveCategory(visible[0].target.id);
        }
      },
      {
        rootMargin: "-150px 0px -60% 0px",
        threshold: 0,
      }
    );

    categories.forEach((category) => {
      const element = document.getElementById(category.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);



  useEffect(() => {
    const container = categoryNavRef.current;
    const button = categoryButtonRefs.current[activeCategory];

    if (!container || !button) return;

    const targetLeft =
        button.offsetLeft -
        (container.clientWidth - button.offsetWidth) / 2;

    container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
    });
    }, [activeCategory, categories]);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "/";
  }
}

  if (loading) {
    return (
      <main className="full-menu">
        <div className="full-menu__status" role="status">
          Preparando nuestra carta…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="full-menu">
        <div className="full-menu__status" role="alert">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="full-menu">
        
<div className="full-menu__fixed-header">
  <div className="full-menu__brand-row">
    <button
      type="button"
      className="full-menu__back"
      onClick={goBack}
    >
      <span aria-hidden="true">←</span> Volver
    </button>

    <span className="full-menu__brand">La Lola</span>

    <span className="full-menu__header-spacer" aria-hidden="true" />
  </div>

  <nav className="full-menu__nav">
        <div
        className="full-menu__nav-categories"
        ref={categoryNavRef}
        >
        {categories.map((category) => (
            <button
            key={category.id}
            ref={(element) => {
                categoryButtonRefs.current[category.id] = element;
            }}
            type="button"
            className={`full-menu__nav-link ${
                activeCategory === category.id
                ? "full-menu__nav-link--active"
                : ""
            }`}
            aria-current={
                activeCategory === category.id ? "location" : undefined
            }
            onClick={() => scrollToSection(category.id)}
            >
            {category.name}
            </button>
        ))}
        </div>

        {currentCategory?.subcategories.length ? (
        <div className="full-menu__nav-subcategories">
            {currentCategory.subcategories.map((subcategory) => (
            <button
                key={subcategory.id}
                type="button"
                className={`full-menu__nav-sub-link ${
                activeSubcategory === subcategory.id
                    ? "full-menu__nav-sub-link--active"
                    : ""
                }`}
                onClick={() => {
                setActiveSubcategory(subcategory.id);
                scrollToSection(subcategory.id);
                }}
            >
                {subcategory.name}
            </button>
            ))}
        </div>
        ) : null}
    </nav>
    </div>
      
      <div className="full-menu__content">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="full-menu__category"
          >


            <div className="full-menu__category-heading">
            <h2>{category.name}</h2>
            <span className="full-menu__category-line" />
            </div>

            {CATEGORY_COMMENTS[normalize(category.name)] && (
            <p className="full-menu__comment">
                {CATEGORY_COMMENTS[normalize(category.name)]}
            </p>
            )}



            {category.subcategories.length ? (
              <>
                {category.subcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    id={subcategory.id}
                    className="full-menu__subcategory"
                  >
                    <h3 className="full-menu__subcategory-title">
                      {subcategory.name}
                    </h3>

                    {SUBCATEGORY_COMMENTS[subcategory.id] && (
                    <p className="full-menu__comment">
                        {SUBCATEGORY_COMMENTS[subcategory.id]}
                    </p>
                    )}

                    <div className="full-menu__items">
                      {subcategory.items.map((item) => (
                        <article
                          key={item.id}
                          className="full-menu__item"
                        >
                          <div className="full-menu__item-main">
                            <h4 className="full-menu__item-name">
                              {item.name}
                            </h4>

                            {item.ingredients?.trim() ? (
                              <p className="full-menu__ingredients">
                                {item.ingredients}
                              </p>
                            ) : null}

                            {item.allergens?.length ? (
                              <p className="full-menu__allergens">
                                <span>Alérgenos:</span>{" "}
                                {item.allergens.join(", ")}
                              </p>
                            ) : null}
                          </div>

                          <p className="full-menu__price">
                            {formatPrice(Number(item.price))}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}

                {category.items.some((item) => !item.subcategory?.trim()) ? (
                  <div className="full-menu__items">
                    {category.items
                      .filter((item) => !item.subcategory?.trim())
                      .map((item) => (
                        <article
                          key={item.id}
                          className="full-menu__item"
                        >
                          <div className="full-menu__item-main">
                            <h4 className="full-menu__item-name">
                              {item.name}
                            </h4>
                            {item.ingredients?.trim() ? (
                              <p className="full-menu__ingredients">
                                {item.ingredients}
                              </p>
                            ) : null}
                            {item.allergens?.length ? (
                              <p className="full-menu__allergens">
                                <span>Alérgenos:</span>{" "}
                                {item.allergens.join(", ")}
                              </p>
                            ) : null}
                          </div>
                          <p className="full-menu__price">
                            {formatPrice(Number(item.price))}
                          </p>
                        </article>
                      ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="full-menu__items">
                {category.items.map((item) => (
                  <article key={item.id} className="full-menu__item">
                    <div className="full-menu__item-main">
                      <h4 className="full-menu__item-name">
                        {item.name}
                      </h4>
                      {item.ingredients?.trim() ? (
                        <p className="full-menu__ingredients">
                          {item.ingredients}
                        </p>
                      ) : null}
                      {item.allergens?.length ? (
                        <p className="full-menu__allergens">
                          <span>Alérgenos:</span>{" "}
                          {item.allergens.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <p className="full-menu__price">
                      {formatPrice(Number(item.price))}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
