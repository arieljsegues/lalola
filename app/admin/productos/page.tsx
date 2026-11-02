
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/app/components/admin-guard";
import { supabase } from "@/app/lib/supabase/client";

type MenuItem = {
  id: string;
  name: string;
  ingredients: string | null;
  price: string | number;
  category: string;
  allergens: string | null;
  is_available: boolean;
  created_at: string;
  sort_order: number;
  subcategory: string | null;
  is_featured: boolean;
  image_url: string | null;
};

type ProductForm = {
  name: string;
  ingredients: string;
  price: string;
  category: string;
  subcategory: string;
  allergens: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: string;
  image_url: string;
};

const emptyForm: ProductForm = {
  name: "",
  ingredients: "",
  price: "",
  category: "Begudes",
  subcategory: "",
  allergens: "",
  is_available: true,
  is_featured: false,
  sort_order: "0",
  image_url: "",
};

function ProductsContent() {
  const router = useRouter();

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setError("No se han podido cargar los productos: " + error.message);
    } else {
      setProducts((data ?? []) as MenuItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(
    () => [
      "Todas",
      ...Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ).sort(),
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.ingredients ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "Todas" || p.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNewProduct() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: String(products.length + 1),
    });
    setSelectedImage(null);
    setPreview("");
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditProduct(product: MenuItem) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      ingredients: product.ingredients ?? "",
      price: String(product.price),
      category: product.category,
      subcategory: product.subcategory ?? "",
      allergens: product.allergens ?? "",
      is_available: product.is_available,
      is_featured: product.is_featured,
      sort_order: String(product.sort_order ?? 0),
      image_url: product.image_url ?? "",
    });

    setSelectedImage(null);
    setPreview(product.image_url ?? "");
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function handleImageChange(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadImage(): Promise<string | null> {
    if (!selectedImage) return form.image_url || null;

    const extension = selectedImage.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `products/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filePath, selectedImage, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedImage.type,
      });

    if (uploadError) {
      throw new Error("Error al subir la fotografía: " + uploadError.message);
    }

    const { data } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!form.name.trim() || !form.price.trim() || !form.category.trim()) {
        throw new Error("Completa el nombre, precio y categoría.");
      }

      const parsedPrice = Number(form.price.replace(",", "."));

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new Error("Introduce un precio válido.");
      }

      const imageUrl = await uploadImage();

      const productData = {
        name: form.name.trim(),
        ingredients: form.ingredients.trim() || null,
        price: parsedPrice.toFixed(2),
        category: form.category.trim(),
        subcategory: form.subcategory.trim() || null,
        allergens: form.allergens.trim() || null,
        is_available: form.is_available,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
        image_url: imageUrl,
      };

      if (editingId) {
        const { error } = await supabase
          .from("menu_items")
          .update(productData)
          .eq("id", editingId);

        if (error) throw error;

        setMessage("Producto actualizado correctamente.");
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert(productData);

        if (error) throw error;

        setMessage("Producto creado correctamente.");
      }

      await loadProducts();
      setShowForm(false);
      setSelectedImage(null);
      setPreview("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se ha podido guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(product: MenuItem) {
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);

    if (error) {
      setError("No se ha podido cambiar la disponibilidad: " + error.message);
      return;
    }

    await loadProducts();
  }

  async function deleteProduct(product: MenuItem) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", product.id);

    if (error) {
      setError("No se ha podido eliminar: " + error.message);
      return;
    }

    setMessage("Producto eliminado.");
    await loadProducts();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login/");
  }

  const availableCount = products.filter((p) => p.is_available).length;

  return (
    <main className="admin-container">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">LA LOLA · RESTAURANT</p>
          <h1>Gestión de la carta</h1>
          <p className="admin-muted">
            Administra los productos de tu restaurante.
          </p>
        </div>

        <button className="admin-secondary" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="admin-stats">
        <div className="admin-stat">
          <span>Total productos</span>
          <strong>{products.length}</strong>
        </div>
        <div className="admin-stat">
          <span>Disponibles</span>
          <strong>{availableCount}</strong>
        </div>
        <div className="admin-stat">
          <span>No disponibles</span>
          <strong>{products.length - availableCount}</strong>
        </div>
      </section>

      <section className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="admin-input"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button className="admin-primary" onClick={openNewProduct}>
          + Añadir producto
        </button>
      </section>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <section className="admin-product-list">
          {filteredProducts.map((product) => (
            <article className="admin-product" key={product.id}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="admin-no-image">Sin imagen</div>
              )}

              <div className="admin-product-info">
                <strong>{product.name}</strong>
                <span>{product.category} · {product.subcategory || "Sin subcategoría"}</span>
                <strong>{Number(product.price).toFixed(2)} €</strong>
                <span className={product.is_available ? "admin-active" : "admin-inactive"}>
                  {product.is_available ? "Disponible" : "No disponible"}
                </span>
              </div>

              <div className="admin-product-actions">
                <button
                  className="admin-secondary"
                  onClick={() => toggleAvailability(product)}
                >
                  {product.is_available ? "Ocultar" : "Activar"}
                </button>

                <button
                  className="admin-secondary"
                  onClick={() => openEditProduct(product)}
                >
                  Editar
                </button>

                <button
                  className="admin-danger"
                  onClick={() => deleteProduct(product)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}

          {filteredProducts.length === 0 && (
            <p>No se han encontrado productos.</p>
          )}
        </section>
      )}

      {showForm && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal">
            <div className="admin-modal-header">
              <h2>{editingId ? "Editar producto" : "Nuevo producto"}</h2>
              <button
                className="admin-secondary"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={saveProduct} className="admin-form">
              <label>
                Nombre del producto *
                <input
                  className="admin-input"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </label>

              <label>
                Precio (€) *
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  required
                />
              </label>

              <label>
                Ingredientes / descripción
                <textarea
                  className="admin-input"
                  value={form.ingredients}
                  onChange={(e) => updateField("ingredients", e.target.value)}
                  rows={3}
                />
              </label>

              <label>
                Categoría *
                <input
                  className="admin-input"
                  list="menu-categories"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  required
                />
                <datalist id="menu-categories">
                  {categories.filter((c) => c !== "Todas").map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>

              <label>
                Subcategoría
                <input
                  className="admin-input"
                  value={form.subcategory}
                  onChange={(e) => updateField("subcategory", e.target.value)}
                />
              </label>

              <label>
                Alérgenos
                <input
                  className="admin-input"
                  value={form.allergens}
                  onChange={(e) => updateField("allergens", e.target.value)}
                />
              </label>

              <label>
                Orden de aparición
                <input
                  className="admin-input"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => updateField("sort_order", e.target.value)}
                />
              </label>

              <label>
                Fotografía del producto
                <input
                  className="admin-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />
              </label>

              {preview && (
                <img
                  src={preview}
                  alt="Vista previa"
                  className="admin-image-preview"
                />
              )}

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => updateField("is_available", e.target.checked)}
                />
                Producto disponible
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => updateField("is_featured", e.target.checked)}
                />
                Producto destacado
              </label>

              {error && <p className="admin-error">{error}</p>}

              <button
                className="admin-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar producto"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <AdminGuard>
      <ProductsContent />
    </AdminGuard>
  );
}
