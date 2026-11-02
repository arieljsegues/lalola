
"use client";

import { useRouter } from "next/navigation";
import AdminGuard from "@/app/components/admin-guard";
import { supabase } from "@/app/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login/");
  }

  return (
    <AdminGuard>
      <main className="dashboard-page">
        <div className="dashboard-container">

          <header className="dashboard-header">
            <div className="dashboard-brand">
              <span className="dashboard-logo">L</span>
              <div>
                <p className="dashboard-eyebrow">RESTAURANTE</p>
                <h1>La Lola</h1>
              </div>
            </div>

            <button
              className="dashboard-logout"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </header>

          <section className="dashboard-welcome">
            <p className="dashboard-section-label">
              PANEL DE CONTROL
            </p>
            <h2>¡Bienvenido!</h2>
            <p>
              Desde aquí puedes gestionar el contenido y los productos
              de La Lola.
            </p>
          </section>

          <section className="dashboard-section">
            <h3>Gestión del restaurante</h3>

            <div className="dashboard-grid">
              <button
                className="dashboard-card"
                onClick={() => router.push("/admin/productos/")}
              >
                <span className="dashboard-card-icon">✦</span>
                <span className="dashboard-card-title">
                  Gestionar productos
                </span>
                <span className="dashboard-card-description">
                  Añade, edita y elimina productos de la carta.
                </span>
                <span className="dashboard-card-link">
                  Abrir gestión →
                </span>
              </button>
            </div>
          </section>

          <footer className="dashboard-footer">
            La Lola · Panel privado de administración
          </footer>

        </div>
      </main>
    </AdminGuard>
  );
}
