
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "../components/cart/CartProvider";
import { supabase } from "../lib/supabase/client";

type OrderType = "takeaway" | "delivery";
type PaymentMethod = "card" | "cash";
type CashOption = "exact" | "change";

type CustomerData = {
  name: string;
  phone: string;
  street: string;
  floor: string;
  postalCode: string;
  city: string;
};

type StoredCustomerData = CustomerData & {
  savedAt: number;
};

const DELIVERY_FEE = 2;

const CUSTOMER_STORAGE_KEY = "lalola-customer-data";
const CUSTOMER_DATA_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

// Horario: 20:00 a 23:00, cada 15 minutos.
const TIME_OPTIONS = Array.from({ length: 13 }, (_, index) => {
  const totalMinutes = 20 * 60 + index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(now.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
}

function getDateString(date: Date) {
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
}

function getDayOfWeek(date: string) {
  if (!date) return -1;
  return new Date(`${date}T12:00:00`).getDay();
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function isValidPhone(phone: string) {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+34|0034)?[6789]\d{8}$/.test(cleaned);
}

// Convierte cantidades como "50", "50€" o "50,00" en números.
function parseCashAmount(value: string): number {
  const normalized = value
    .replace(/[€\s]/g, "")
    .replace(",", ".");

  return Number(normalized);
}

export default function CheckoutPage() {
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    addItem,
    updateQuantity,
    clearCart,
  } = useCart();

  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [cashOption, setCashOption] = useState<CashOption>("exact");
  const [cashAmount, setCashAmount] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [street, setStreet] = useState("");
  const [floor, setFloor] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [saveCustomerData, setSaveCustomerData] = useState(false);
  const [hasSavedCustomerData, setHasSavedCustomerData] = useState(false);

  const [notice, setNotice] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  // Recuperar los datos guardados si el cliente dio su consentimiento.
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(CUSTOMER_STORAGE_KEY);

      if (!savedData) return;

      const customer = JSON.parse(savedData) as Partial<StoredCustomerData>;

      if (
        typeof customer.savedAt !== "number" ||
        Date.now() - customer.savedAt > CUSTOMER_DATA_MAX_AGE ||
        customer.savedAt > Date.now()
      ) {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
        return;
      }

      if (
        typeof customer.name !== "string" ||
        typeof customer.phone !== "string"
      ) {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
        return;
      }

      setName(customer.name || "");
      setPhone(customer.phone || "");
      setStreet(typeof customer.street === "string" ? customer.street : "");
      setFloor(typeof customer.floor === "string" ? customer.floor : "");
      setPostalCode(
        typeof customer.postalCode === "string" ? customer.postalCode : ""
      );
      setCity(typeof customer.city === "string" ? customer.city : "");

      setSaveCustomerData(true);
      setHasSavedCustomerData(true);
    } catch (error) {
      console.error("Error al recuperar los datos del cliente:", error);

      try {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      } catch {
        // El navegador puede tener bloqueado el almacenamiento.
      }
    }
  }, []);

  // Inicializar fecha y mantener actualizado el reloj.
  useEffect(() => {
    const updateClock = () => {
      const currentDate = new Date();

      setNow(currentDate);
      setDate((previousDate) =>
        previousDate || getDateString(currentDate)
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 30000);

    return () => clearInterval(interval);
  }, []);

  const today = now ? getDateString(now) : "";
  const dayOfWeek = getDayOfWeek(date);

  // Lunes y martes cerrado.
  const isClosed = dayOfWeek === 1 || dayOfWeek === 2;

  // Domicilio únicamente miércoles, jueves y domingo.
  const deliveryAvailable =
    dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 4;

  const serviceAvailable = !isClosed;

  // Si el usuario elige un día sin domicilio, cambiar a Take Away.
  useEffect(() => {
    if (!deliveryAvailable && orderType === "delivery") {
      setOrderType("takeaway");
    }
  }, [deliveryAvailable, orderType]);

  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;

  const finalTotal = useMemo(
    () => totalPrice + deliveryFee,
    [totalPrice, deliveryFee]
  );

  // Calcular las horas disponibles.
  const availableTimeOptions = useMemo(() => {
    if (!now || !date || date < today) {
      return [];
    }

    const selectedDay = getDayOfWeek(date);

    if (selectedDay === 1 || selectedDay === 2) {
      return [];
    }

    if (date > today) {
      return TIME_OPTIONS;
    }

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    return TIME_OPTIONS.filter((hour) => {
      const [hours, minutes] = hour.split(":").map(Number);
      return hours * 60 + minutes > currentMinutes;
    });
  }, [date, now, today]);

  // Borrar la hora si deja de estar disponible.
  useEffect(() => {
    if (time && !availableTimeOptions.includes(time)) {
      setTime("");
    }
  }, [time, availableTimeOptions]);

  // Guardar o eliminar los datos recordados.
  function handleRememberDataChange(checked: boolean) {
    setSaveCustomerData(checked);

    if (!checked) {
      try {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
        setHasSavedCustomerData(false);
      } catch (error) {
        console.error("No se pudieron borrar los datos:", error);
      }
    }
  }

  // Borrar los datos guardados sin vaciar los campos del pedido actual.
  function handleDeleteSavedData() {
    try {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);

      setSaveCustomerData(false);
      setHasSavedCustomerData(false);
      setNotice("Les teves dades desades s'han eliminat d'aquest dispositiu.");
    } catch (error) {
      console.error("Error al borrar los datos:", error);
      setNotice("No s'han pogut esborrar les dades desades.");
    }
  }

  // Reducir una unidad o eliminar el producto.
  function handleDecrease(item: { id: string; quantity: number }) {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  }

  // Enviar pedido a Supabase Edge Function.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSending) return;

    setNotice("");
    setPhoneError("");

    if (items.length === 0) {
      setNotice("El carrito está vacío.");
      return;
    }

    if (!name.trim()) {
      setNotice("Introdueix el teu nom complet.");
      return;
    }

    if (!isValidPhone(phone)) {
      setPhoneError(
        "Introdueix un número de telèfon vàlid (ex: 612345678)."
      );
      setNotice("Si us plau, revisa els errors del formulari.");
      return;
    }

    if (!date) {
      setNotice("Selecciona una fecha para tu pedido.");
      return;
    }

    if (date < getLocalDate()) {
      setNotice("No puedes seleccionar una fecha que ya ha pasado.");
      return;
    }

    if (!serviceAvailable) {
      setNotice("La Lola está cerrada el día seleccionado.");
      return;
    }

    if (orderType === "delivery" && !deliveryAvailable) {
      setNotice("No ofrecemos domicilio el día seleccionado.");
      return;
    }

    if (orderType === "delivery") {
      if (
        !street.trim() ||
        !floor.trim() ||
        !postalCode.trim() ||
        !city.trim()
      ) {
        setNotice("Completa todos los campos de la dirección de entrega.");
        return;
      }
    }

    if (!time || !availableTimeOptions.includes(time)) {
      setNotice(
        "Selecciona una hora disponible entre las 20:00 y las 23:00."
      );
      return;
    }

    let parsedCashAmount: number | undefined;

    if (orderType === "delivery" && payment === "cash") {
      if (cashOption === "change") {
        parsedCashAmount = parseCashAmount(cashAmount);

        if (
          !cashAmount.trim() ||
          !Number.isFinite(parsedCashAmount) ||
          parsedCashAmount <= finalTotal
        ) {
          setNotice(
            "Indica una cantidad válida y superior al total para preparar el cambio."
          );
          return;
        }
      }
    }

    // Guardar los datos solamente si el cliente ha dado su consentimiento.
    try {
      if (saveCustomerData) {
        const customerData: StoredCustomerData = {
          name: name.trim(),
          phone: phone.trim(),
          street: street.trim(),
          floor: floor.trim(),
          postalCode: postalCode.trim(),
          city: city.trim(),
          savedAt: Date.now(),
        };

        localStorage.setItem(
          CUSTOMER_STORAGE_KEY,
          JSON.stringify(customerData)
        );

        setHasSavedCustomerData(true);
      } else {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
        setHasSavedCustomerData(false);
      }
    } catch (error) {
      console.error("No se pudieron guardar los datos:", error);
    }

    // Preparar el pedido. Los precios se consultarán en Supabase.
    const orderPayload = {
      orderType,
      name: name.trim(),
      phone: phone.trim(),
      date,
      time,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      ...(orderType === "delivery"
        ? {
            street: street.trim(),
            floor: floor.trim(),
            postalCode: postalCode.trim(),
            city: city.trim(),
            paymentMethod: payment,
            ...(payment === "cash"
              ? {
                  cashOption,
                  ...(cashOption === "change"
                    ? { cashAmount: parsedCashAmount }
                    : {}),
                }
              : {}),
          }
        : {}),
    };

    setIsSending(true);

    try {
        console.log(
  "Supabase URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

console.log(
  "Publishable key disponible:",
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
);
      const { data, error } = await supabase.functions.invoke(
        "send-order-whatsapp",
        {
          body: orderPayload,
        }
      );

      if (error) {
        console.error("Error llamando a la Edge Function:", error);
        setNotice(
          "No se ha podido conectar con el servicio de pedidos. Inténtalo de nuevo."
        );
        return;
      }

      if (!data || data.success !== true) {
        console.error("La función ha devuelto un error:", data);

        setNotice(
          typeof data?.error === "string"
            ? data.error
            : "No se ha podido enviar el pedido. Inténtalo de nuevo."
        );
        return;
      }

      // Solo vaciar el carrito cuando WhatsApp acepta el envío.
      clearCart();
      setOrderSent(true);
      setNotice("");
    } catch (error) {
      console.error("Error inesperado al enviar el pedido:", error);

      setNotice(
        "Ha ocurrido un error al enviar el pedido. Inténtalo de nuevo."
      );
    } finally {
      setIsSending(false);
    }
  }

  // Pantalla de confirmación.
  if (orderSent) {
    return (
      <main className="checkout">
        <div className="checkout__empty">
          <span className="checkout__eyebrow">LA LOLA</span>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            ✓
          </div>
          <h1>Comanda enviada!</h1>
          <p>
            La teva comanda s'ha enviat correctament al restaurant.
            Gràcies per confiar en La Lola!
          </p>

          <Link href="/carta/" className="button button--primary">
            Tornar a la carta
          </Link>
        </div>
      </main>
    );
  }

  if (totalItems === 0) {
    return (
      <main className="checkout">
        <div className="checkout__empty">
          <span className="checkout__eyebrow">LA LOLA</span>
          <h1>La teva cistella és buida</h1>
          <p>Afegeix productes per continuar.</p>

          <Link href="/carta/" className="button button--primary">
            Veure la carta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout">
      <div className="checkout__container">
        <header className="checkout__header">
          <Link href="/carta/" className="checkout__back">
            ← Tornar a la carta
          </Link>

          <span className="checkout__eyebrow">LA LOLA</span>
          <h1>Finalitzar comanda</h1>
          <p>
            Ja falta molt poc per gaudir del teu menjar preferit.
          </p>
        </header>

        <div className="checkout__grid">
          <form
            className="checkout__form"
            onSubmit={handleSubmit}
          >
            {/* 1. Modalidad de la comanda */}
            <section className="checkout__section">
              <h2>¿Com vols rebre la teva comanda?</h2>

              <div className="checkout__service-options">
                <button
                  type="button"
                  className={`checkout__service ${
                    orderType === "takeaway"
                      ? "checkout__service--active"
                      : ""
                  }`}
                  onClick={() => {
                    setOrderType("takeaway");
                    setNotice("");
                  }}
                >
                  <span className="checkout__service-icon">🥡</span>
                  <strong>Take Away</strong>
                  <small>Recollir al restaurant</small>
                </button>

                <button
                  type="button"
                  disabled={!deliveryAvailable}
                  className={`checkout__service ${
                    orderType === "delivery"
                      ? "checkout__service--active"
                      : ""
                  }`}
                  onClick={() => {
                    setOrderType("delivery");
                    setNotice("");
                  }}
                >
                  <span className="checkout__service-icon">🛵</span>
                  <strong>Domicili</strong>
                  <small>
                    {deliveryAvailable
                      ? "+2,00 € de suplement"
                      : "No disponible aquest dia"}
                  </small>
                </button>
              </div>

              {isClosed && (
                <p className="checkout__warning">
                  Els dilluns i dimarts La Lola roman tancada.
                  Selecciona un altre dia per continuar.
                </p>
              )}

              {!isClosed && !deliveryAvailable && (
                <p className="checkout__info">
                  Els divendres i dissabtes només oferim Take Away.
                </p>
              )}
            </section>

            {/* 2. Datos personales */}
            <section className="checkout__section">
              <h2>2. Les teves dades</h2>

              <div className="checkout__fields">
                <label className="checkout__field">
                  Nom complet
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="El teu nom"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="checkout__field">
                  Telèfon
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);

                      if (phoneError) {
                        setPhoneError("");
                      }
                    }}
                    onBlur={() => {
                      if (phone && !isValidPhone(phone)) {
                        setPhoneError(
                          "Introdueix un número de telèfon vàlid."
                        );
                      }
                    }}
                    placeholder="El teu telèfon (ex: 612345678)"
                    autoComplete="tel"
                    required
                  />

                  {phoneError && (
                    <small
                      style={{
                        color: "#d9381e",
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      {phoneError}
                    </small>
                  )}
                </label>
              </div>

              {/* Consentimiento para guardar los datos */}
              <div className="checkout__remember">
                <label>
                  <input
                    type="checkbox"
                    checked={saveCustomerData}
                    onChange={(event) =>
                      handleRememberDataChange(event.target.checked)
                    }
                  />

                  <span>
                    <strong>
                      Recordar les meves dades en aquest dispositiu
                    </strong>

                    <small>
                      Desarem el teu nom, telèfon i adreça
                      en aquest navegador perquè no hagis de
                      introduir-los en futures compres. No s'emmagatzemen al núvol ni a altres dispositius.
                    </small>
                  </span>
                </label>

                {hasSavedCustomerData && (
                  <button
                    type="button"
                    className="checkout__delete-data"
                    onClick={handleDeleteSavedData}
                  >
                    Esborrar les meves dades
                  </button>
                )}
              </div>
            </section>

            {/* 3. Dirección de entrega */}
            {orderType === "delivery" && (
              <section className="checkout__section">
                <h2>3. Adreça de lliurament</h2>

                <div className="checkout__fields">
                  <label className="checkout__field checkout__field--full">
                    Carrer i número
                    <input
                      type="text"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      placeholder="Carrer, número i escala"
                      autoComplete="street-address"
                      required
                    />
                  </label>

                  <label className="checkout__field">
                    Pis i porta
                    <input
                      type="text"
                      value={floor}
                      onChange={(event) => setFloor(event.target.value)}
                      placeholder="Ex. 2n 1a"
                      required
                    />
                  </label>

                  <label className="checkout__field">
                    Codi postal
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      placeholder="Codi postal"
                      autoComplete="postal-code"
                      required
                    />
                  </label>

                  <label className="checkout__field checkout__field--full">
                    Localitat
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="La teva localitat"
                      autoComplete="address-level2"
                      required
                    />
                  </label>
                </div>
              </section>
            )}

            {/* 4. Fecha y hora */}
            <section className="checkout__section">
              <h2>{orderType === "delivery" ? "4." : "3."} Data i hora</h2>

              <div className="checkout__fields">
                <label className="checkout__field">
                  {orderType === "delivery"
                    ? "Data de lliurament"
                    : "Data de recollida"}

                  <input
                    type="date"
                    value={date}
                    min={today || getLocalDate()}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setTime("");
                      setNotice("");
                    }}
                    required
                  />
                </label>

                <div className="checkout__field checkout__time-field">
                  <span>
                    {orderType === "delivery"
                      ? "Hora de lliurament"
                      : "Hora de recollida"}
                  </span>

                  <div
                    className="checkout__time-scroll"
                    role="group"
                    aria-label="Seleccionar hora"
                  >
                    {TIME_OPTIONS.map((hour) => {
                      const available =
                        availableTimeOptions.includes(hour);
                      const selected = time === hour;

                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={!available}
                          aria-pressed={selected}
                          className={`checkout__time-option ${
                            selected
                              ? "checkout__time-option--active"
                              : ""
                          } ${
                            !available
                              ? "checkout__time-option--disabled"
                              : ""
                          }`}
                          onClick={() => {
                            setTime(hour);
                            setNotice("");
                          }}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>

                  {!now ? (
                    <small className="checkout__time-message">
                      Calculant horaris disponibles...
                    </small>
                  ) : availableTimeOptions.length === 0 ? (
                    <small className="checkout__time-message">
                      No queden horaris disponibles. Selecciona una altra data.
                    </small>
                  ) : (
                    <small className="checkout__time-message">
                      Llisca per veure més horaris · Cada 15 minuts.
                    </small>
                  )}
                </div>
              </div>
            </section>

            {/* 5. Forma de pago: solamente domicilio */}
            {orderType === "delivery" && (
              <section className="checkout__section">
                <h2>5. Forma de pagament</h2>

                <div className="checkout__payment-options">
                  <label
                    className={`checkout__payment ${
                      payment === "card"
                        ? "checkout__payment--active"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={payment === "card"}
                      onChange={() => setPayment("card")}
                    />
                    <span>💳</span>
                    Targeta
                  </label>

                  <label
                    className={`checkout__payment ${
                      payment === "cash"
                        ? "checkout__payment--active"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={payment === "cash"}
                      onChange={() => setPayment("cash")}
                    />
                    <span>💶</span>
                    Efectiu
                  </label>
                </div>

                {payment === "cash" && (
                  <div
                    className="checkout__cash-options"
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="cashOption"
                        value="exact"
                        checked={cashOption === "exact"}
                        onChange={() => setCashOption("exact")}
                      />
                      <span>No necessito canvi (import exacte)</span>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="cashOption"
                        value="change"
                        checked={cashOption === "change"}
                        onChange={() => setCashOption("change")}
                      />
                      <span>Pagaré amb...</span>
                    </label>

                    {cashOption === "change" && (
                      <div
                        className="checkout__field"
                        style={{
                          marginLeft: "24px",
                          marginTop: "4px",
                        }}
                      >
                        <input
                          type="text"
                          value={cashAmount}
                          onChange={(event) =>
                            setCashAmount(event.target.value)
                          }
                          placeholder="Ex: 50€, 20€..."
                          required={cashOption === "change"}
                        />

                        <small className="checkout__time-message">
                          Indica el bitllet o import amb què pagaràs
                          per portar-te el canvi.
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {notice && (
              <p className="checkout__notice" role="status">
                {notice}
              </p>
            )}

            <button
              type="submit"
              className="button button--primary checkout__submit"
              disabled={
                isSending ||
                isClosed ||
                !date ||
                !time ||
                !availableTimeOptions.includes(time)
              }
            >
              {isSending
                ? "Enviant comanda..."
                : `Enviar comanda · ${formatPrice(finalTotal)}`}
            </button>

            <p className="checkout__disclaimer">
              En prémer el botó, la comanda s'enviarà directament al
              restaurant. No caldrà obrir WhatsApp ni prémer Enviar.
            </p>
          </form>

          {/* Resumen de la comanda */}
          <aside className="checkout__summary">
            <h2>La teva comanda</h2>

            <div className="checkout__summary-items">
              {items.map((item) => (
                <div className="checkout__summary-item" key={item.id}>
                  <div className="checkout__summary-info">
                    <strong>{item.name}</strong>

                    <div className="checkout__quantity-controls">
                      <button
                        type="button"
                        className="checkout__quantity-btn"
                        onClick={() => handleDecrease(item)}
                        aria-label={`Restar una unitat de ${item.name}`}
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        className="checkout__quantity-btn"
                        onClick={() =>
                          addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                          })
                        }
                        aria-label={`Afegir una unitat més de ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="checkout__summary-price-wrapper">
                    <strong>
                      {formatPrice(item.price * item.quantity)}
                    </strong>

                    <button
                      type="button"
                      className="checkout__remove-item"
                      onClick={() => removeItem(item.id)}
                      title="Eliminar producte completament"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout__totals">
              <div>
                <span>Productes ({totalItems})</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              {orderType === "delivery" && (
                <div>
                  <span>Suplement domicili</span>
                  <span>{formatPrice(DELIVERY_FEE)}</span>
                </div>
              )}

              <div className="checkout__grand-total">
                <strong>Total</strong>
                <strong>{formatPrice(finalTotal)}</strong>
              </div>
            </div>

            <Link href="/carta/" className="checkout__continue">
              + Afegir més productes
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
