"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useEffect, useState } from "react";

export default function CartButton() {
  const { totalItems, totalPrice } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);

  // Cada vez que cambia totalItems, disparamos la animación
  useEffect(() => {
    if (totalItems === 0) return;

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Duración de la animación en milisegundos

    return () => clearTimeout(timer);
  }, [totalItems]);

  if (totalItems === 0) return null;

  const formattedPrice = new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
  }).format(totalPrice);

  return (
    <Link 
      href="/checkout/" 
      className={`cart-button ${isAnimating ? "cart-button--bounce" : ""}`}
    >
      <span className="cart-button__icon" aria-hidden="true">
        🛒
      </span>

      <span className="cart-button__label">
        Veure la cistella
      </span>

      <span className="cart-button__count">
        {totalItems}
      </span>

      <span className="cart-button__total">
        {formattedPrice}
      </span>
    </Link>
  );
}