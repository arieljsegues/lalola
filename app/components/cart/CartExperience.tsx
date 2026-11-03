"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "./CartProvider";
import CartButton from "./CartButton";

export default function CartExperience({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const publicPath = (pathname ?? "/").replace(
    /^\/lalola(?=\/|$)/,
    ""
  );

  const isAdmin =
    publicPath === "/admin" ||
    publicPath.startsWith("/admin/");

  const isCheckout =
    publicPath === "/checkout" ||
    publicPath.startsWith("/checkout/");

  // Si es admin, no cargamos nada del carrito
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      {children}
      {/* Ocultamos el botón flotante en la página de checkout */}
      {!isCheckout && <CartButton />}
    </CartProvider>
  );
}