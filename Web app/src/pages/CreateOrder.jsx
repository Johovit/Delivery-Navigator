import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import { useAppContext } from "../context/AppContext";
import { searchCities } from "../data/tamilnaduCities";
import { fetchRoadRoute } from "../services/routingService";
import { makeLabelMarker } from "../utils/mapHelpers";
import { formatDuration } from "../utils/formatters";
import { CheckCircle, Check, ArrowDown, Loader } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const isValidPincode = (p) => /^\d{6}$/.test((p || "").trim());

// Min pickup time = now + 15 minutes
const getMinPickupTime = () => {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

// ── CityInput — defined OUTSIDE the parent so it never remounts on re-render ──
// Props are stable primitive/callback values; no object identity issues.
function CityInput({
  label,
  query,
  onQuery,
  citySelected,
  suggestions,
  onSelect,
  otherCityName,
  pincode,
  onPincode,
  pincodeError,
}) {
  const pincodeOk = isValidPincode(pincode);

  return (
    <div className="city-input-block flex flex-col sm:flex-row gap-4 sm:gap-6 w-full mb-4">
      {/* City search */}
      <div className="input-group w-full" style={{ position: "relative" }}>
        <label htmlFor={`${label.toLowerCase()}-city`}>
          {label} City <span className="required-star">*</span>
        </label>
        <input
          id={`${label.toLowerCase()}-city`}
          name={`${label.toLowerCase()}City`}
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={`Search ${label.toLowerCase()} city in Tamil Nadu…`}
          autoComplete="off"
          className={citySelected ? "input-valid" : ""}
        />
        {citySelected && (
          <span className="input-badge input-badge--ok">Tamil Nadu</span>
        )}
        {/* Dropdown */}
        {suggestions.length > 0 && !citySelected && (
          <ul className="autocomplete-dropdown">
            {suggestions.map((c) => (
              <li key={c.city} onMouseDown={() => onSelect(c)}>
                <span>{c.city}</span>
                <span className="autocomplete-tag">Tamil Nadu</span>
              </li>
            ))}
          </ul>
        )}
        {/* No match warning */}
        {query.length >= 2 && !citySelected && suggestions.length === 0 && (
          <p className="field-hint error">
            Only Tamil Nadu cities allowed. Type "Chennai", "Madurai" etc.
          </p>
        )}
        {/* Same city warning */}
        {citySelected && otherCityName && citySelected === otherCityName && (
          <p className="field-hint error">Pickup and delivery city must differ.</p>
        )}
      </div>

      {/* Pincode */}
      <div className="input-group w-full">
        <label htmlFor={`${label.toLowerCase()}-pincode`}>
          {label} Pincode <span className="required-star">*</span>
        </label>
        <input
          id={`${label.toLowerCase()}-pincode`}
          name={`${label.toLowerCase()}Pincode`}
          autoComplete="postal-code"
          type="text"
          inputMode="numeric"
          value={pincode}
          onChange={(e) => onPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit pincode"
          maxLength={6}
          className={pincodeError ? "input-error" : pincodeOk ? "input-valid" : ""}
        />
        {pincodeError && <p className="field-hint error">{pincodeError}</p>}
        {!pincodeError && pincodeOk && <p className="field-hint ok">Valid pincode</p>}
      </div>
    </div>
  );
}

// ── Payment Success Modal ─────────────────────────────────────────────────────
function PaymentSuccessModal({ amount, pickup, delivery, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-success-icon"><CheckCircle size={48} /></div>
        <h2>Payment Successful!</h2>
        <p className="payment-success-amount">₹{Number(amount).toFixed(2)} paid</p>
        <div className="payment-success-details">
          <p>Order placed successfully</p>
          <p>{pickup} to {delivery}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
            Your order is now <strong>Planned</strong>. It will start automatically at pickup time.
          </p>
        </div>
        <button className="primary-btn" style={{ width: "100%", marginTop: "20px" }} onClick={onClose}>
          View My Orders
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addOrder, settings, showToast } = useAppContext();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Address
  const [pickupQuery, setPickupQuery]       = useState("");
  const [pickupCity, setPickupCity]         = useState(null);
  const [pickupPincode, setPickupPincode]   = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);

  const [deliveryQuery, setDeliveryQuery]       = useState("");
  const [deliveryCity, setDeliveryCity]         = useState(null);
  const [deliveryPincode, setDeliveryPincode]   = useState("");
  const [deliverySuggestions, setDeliverySuggestions] = useState([]);

  const [pincodeErrors, setPincodeErrors] = useState({ pickup: "", delivery: "" });

  // Step 2 — Package
  const [packageType, setPackageType] = useState("Parcel");
  const [weight, setWeight]           = useState("");
  const [description, setDescription] = useState("");
  const [descError, setDescError]     = useState("");

  // Step 3 — Schedule
  const [pickupTime, setPickupTime] = useState("");
  const [timeError, setTimeError]   = useState("");

  // Step 4 — Route
  const [routeInfo, setRouteInfo]     = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError]   = useState("");
  const summaryMapRef = useRef(null);

  // Step 5 — Payment
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Pre-fill pincodes from Dashboard
  useEffect(() => {
    if (location.state?.pickupPincode)  setPickupPincode(location.state.pickupPincode);
    if (location.state?.deliveryPincode) setDeliveryPincode(location.state.deliveryPincode);
  }, [location]);

  // ── Autocomplete (useCallback so identity is stable)
  const handlePickupQuery = useCallback((val) => {
    setPickupQuery(val);
    setPickupCity(null);
    setPickupSuggestions(searchCities(val));
  }, []);

  const selectPickupCity = useCallback((cityObj) => {
    setPickupCity(cityObj);
    setPickupQuery(cityObj.city);
    setPickupSuggestions([]);
  }, []);

  const handleDeliveryQuery = useCallback((val) => {
    setDeliveryQuery(val);
    setDeliveryCity(null);
    setDeliverySuggestions(searchCities(val));
  }, []);

  const selectDeliveryCity = useCallback((cityObj) => {
    setDeliveryCity(cityObj);
    setDeliveryQuery(cityObj.city);
    setDeliverySuggestions([]);
  }, []);

  // ── Step 1 gating
  const validatePincodes = () => {
    const errors = { pickup: "", delivery: "" };
    if (!isValidPincode(pickupPincode))  errors.pickup  = "Must be a 6-digit number";
    if (!isValidPincode(deliveryPincode)) errors.delivery = "Must be a 6-digit number";
    setPincodeErrors(errors);
    return !errors.pickup && !errors.delivery;
  };

  const canProceedStep1 =
    pickupCity &&
    deliveryCity &&
    pickupCity.city !== deliveryCity.city &&
    isValidPincode(pickupPincode) &&
    isValidPincode(deliveryPincode);

  // ── Step 2 validation
  const validateStep2 = () => {
    if (!description.trim()) {
      setDescError("Package description is required.");
      return false;
    }
    setDescError("");
    return true;
  };

  // ── Step 3 — pickup time validation
  const validatePickupTime = () => {
    if (!pickupTime) { setTimeError("Pickup time is required."); return false; }
    const selected = new Date(pickupTime).getTime();
    const minTime  = Date.now() + 15 * 60 * 1000;
    if (selected < minTime) {
      setTimeError("Pickup time must be at least 15 minutes from now.");
      return false;
    }
    setTimeError("");
    return true;
  };

  // ── Route calculation
  const calculateRoute = async () => {
    if (!validatePickupTime()) return;
    if (!pickupCity || !deliveryCity) return;

    setRouteLoading(true);
    setRouteError("");

    try {
      const result = await fetchRoadRoute(
        { lat: pickupCity.lat,  lon: pickupCity.lon },
        { lat: deliveryCity.lat, lon: deliveryCity.lon }
      );

      const costPerKm = settings?.costPerKm ?? 10;
      const cost = Math.max(result.distanceKm * costPerKm, 50);
      const pickupMs = new Date(pickupTime).getTime();
      const estimatedDeliveryTime = new Date(pickupMs + result.durationMinutes * 60 * 1000).toISOString();

      setRouteInfo({ ...result, cost, estimatedDeliveryTime });
      setCurrentStep(4);
    } catch (err) {
      setRouteError(err.message || "Route calculation failed. Try again.");
    } finally {
      setRouteLoading(false);
    }
  };

  // ── Summary map
  useEffect(() => {
    if (currentStep !== 4 || !routeInfo) return;
    const timer = setTimeout(() => {
      const container = document.getElementById("summary-map");
      if (!container) return;
      if (summaryMapRef.current) { summaryMapRef.current.remove(); summaryMapRef.current = null; }
      container._leaflet_id = null;

      const map = L.map(container, { zoomControl: true }).setView(routeInfo.geometry[0] || [11, 78], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      const poly = L.polyline(routeInfo.geometry, { color: "#2563EB", weight: 5, opacity: 0.9 }).addTo(map);
      L.marker(routeInfo.geometry[0], { icon: makeLabelMarker("A", "#16A34A") }).addTo(map).bindPopup(pickupCity.city).openPopup();
      L.marker(routeInfo.geometry[routeInfo.geometry.length - 1], { icon: makeLabelMarker("B", "#DC2626") }).addTo(map).bindPopup(deliveryCity.city);
      map.fitBounds(poly.getBounds(), { padding: [24, 24] });
      setTimeout(() => map.invalidateSize(), 100);
      summaryMapRef.current = map;
    }, 120);
    return () => {
      clearTimeout(timer);
      if (summaryMapRef.current) { summaryMapRef.current.remove(); summaryMapRef.current = null; }
    };
  }, [currentStep, routeInfo]);

  // ── Order submission
  const handleConfirmOrder = async () => {
    if (!paymentMethod) { showToast("Please select a payment method", "error"); return; }
    setIsSubmitting(true);
    try {
      await addOrder({
        pickupAddress:  `${pickupCity.city} - ${pickupPincode}`,
        deliveryAddress: `${deliveryCity.city} - ${deliveryPincode}`,
        pickupPincode,
        deliveryPincode,
        packageType,
        weight: parseFloat(weight) || 0,
        description: description.trim(),
        pickupTime: new Date(pickupTime).toISOString(),
        deliveryTime: routeInfo.estimatedDeliveryTime,
        distanceKm: routeInfo.distanceKm,
        estimatedDurationMinutes: routeInfo.durationMinutes,
        cost: routeInfo.cost,
        geometry: routeInfo.geometry,
        status: "planned",
        paymentMethod,
      });
      setShowSuccessModal(true);
    } catch (e) {
      showToast(e.message || "Error placing order", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Steps config
  const steps = ["Address", "Package", "Schedule", "Summary", "Payment"];

  return (
    <div className="page create-order-page">
      {/* Payment Success Modal */}
      {showSuccessModal && (
        <PaymentSuccessModal
          amount={routeInfo?.cost}
          pickup={pickupCity?.city}
          delivery={deliveryCity?.city}
          onClose={() => { setShowSuccessModal(false); navigate("/track-orders"); }}
        />
      )}

      {/* Stepper */}
      <div className="order-stepper flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 overflow-x-auto w-full pb-2 mb-6">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={`step ${currentStep > idx + 1 ? "completed" : ""} ${currentStep === idx + 1 ? "active" : ""}`}
          >
            <div className="step-circle">{currentStep > idx + 1 ? <Check size={16} /> : idx + 1}</div>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── STEP 1 ── */}
      {currentStep === 1 && (
        <div className="form-card slide-in">
          <h2>Delivery Locations</h2>
          <p className="form-subtitle">Only Tamil Nadu cities are supported. Start typing to see suggestions.</p>

          <CityInput
            label="Pickup"
            query={pickupQuery}
            onQuery={handlePickupQuery}
            citySelected={pickupCity?.city}
            suggestions={pickupSuggestions}
            onSelect={selectPickupCity}
            otherCityName={deliveryCity?.city}
            pincode={pickupPincode}
            onPincode={setPickupPincode}
            pincodeError={pincodeErrors.pickup}
          />

          <div className="city-divider"><ArrowDown size={20} /></div>

          <CityInput
            label="Delivery"
            query={deliveryQuery}
            onQuery={handleDeliveryQuery}
            citySelected={deliveryCity?.city}
            suggestions={deliverySuggestions}
            onSelect={selectDeliveryCity}
            otherCityName={pickupCity?.city}
            pincode={deliveryPincode}
            onPincode={setDeliveryPincode}
            pincodeError={pincodeErrors.delivery}
          />

          <button
            className="accent-btn step-next-btn"
            onClick={() => { if (validatePincodes()) setCurrentStep(2); }}
            disabled={!canProceedStep1}
          >
            Next: Package Details
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {currentStep === 2 && (
        <div className="form-card slide-in">
          <h2>Package Details</h2>

          <div className="input-group">
            <label htmlFor="packageType">Package Type</label>
            <select id="packageType" name="packageType" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
              <option value="Parcel">Parcel (Standard Box)</option>
              <option value="Courier">Courier (Documents / Letters)</option>
              <option value="Fragile">Fragile (Handle with Care)</option>
              <option value="Bulk">Bulk / Heavy Freight</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="weight">Weight (kg) <span className="required-star">*</span></label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 2.5"
            />
          </div>

          <div className="input-group">
            <label htmlFor="description">
              Description <span className="required-star">*</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "12px", marginLeft: "6px" }}>
                (what's inside, special instructions)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setDescError(""); }}
              placeholder="e.g. Electronic items, fragile — handle with care"
              className={descError ? "input-error" : ""}
            />
            {descError && <p className="field-hint error">{descError}</p>}
          </div>

          <div className="form-actions flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <button className="secondary-btn w-full sm:w-auto" onClick={() => setCurrentStep(1)}>Back</button>
            <button
              className="accent-btn w-full sm:w-auto"
              onClick={() => { if (validateStep2() && parseFloat(weight) > 0) setCurrentStep(3); else if (parseFloat(weight) <= 0 || !weight) showToast("Please enter a valid weight", "error"); }}
              disabled={!weight}
            >
              Next: Schedule
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {currentStep === 3 && (
        <div className="form-card slide-in">
          <h2>Schedule Pickup</h2>

          <div className="input-group">
            <label htmlFor="pickupTime">
              Pickup Date & Time <span className="required-star">*</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "12px", marginLeft: "6px" }}>
                (minimum 15 min from now)
              </span>
            </label>
            <input
              id="pickupTime"
              name="pickupTime"
              type="datetime-local"
              value={pickupTime}
              min={getMinPickupTime()}
              onChange={(e) => { setPickupTime(e.target.value); setTimeError(""); }}
              className={timeError ? "input-error" : ""}
            />
            {timeError && <p className="field-hint error">{timeError}</p>}
          </div>

          {/* Route preview */}
          <div className="route-preview-box">
            <p><strong>Pickup:</strong> {pickupCity?.city} — {pickupPincode}</p>
            <p><strong>Delivery:</strong> {deliveryCity?.city} — {deliveryPincode}</p>
            <p className="route-preview-hint">Route will be fetched via OSRM road routing</p>
          </div>

          {routeError && (
            <div className="alert-error">{routeError}</div>
          )}

          <div className="form-actions flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <button className="secondary-btn w-full sm:w-auto" onClick={() => setCurrentStep(2)}>Back</button>
            <button className="accent-btn w-full sm:w-auto" onClick={calculateRoute} disabled={!pickupTime || routeLoading}>
              {routeLoading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Loader className="spin" size={18} /> Fetching route...
                </span>
              ) : (
                "Calculate Route and Summary"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {currentStep === 4 && routeInfo && (
        <div className="form-card slide-in">
          <h2>Order Summary</h2>
          <div className="summary-grid">
            <div className="summary-details">
              <div className="summary-items-grid">
                {[
                  { label: "Pickup",    value: `${pickupCity.city}\n${pickupPincode}` },
                  { label: "Delivery",  value: `${deliveryCity.city}\n${deliveryPincode}` },
                  { label: "Distance",  value: `${routeInfo.distanceKm.toFixed(1)} km (road)` },
                  { label: "Duration",  value: formatDuration(Math.round(routeInfo.durationMinutes)) },
                  { label: "Package",   value: `${packageType} · ${weight} kg` },
                  { label: "Contents",  value: description },
                  { label: "Pickup At", value: new Date(pickupTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
                  { label: "Est. Delivery", value: new Date(routeInfo.estimatedDeliveryTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="summary-item">
                    <span className="summary-item-label">{label}</span>
                    <p className="summary-item-value">{value}</p>
                  </div>
                ))}
              </div>

              <div className="cost-highlight-box">
                <p className="cost-highlight-label">Total Delivery Cost</p>
                <p className="cost-highlight-value">₹{routeInfo.cost.toFixed(2)}</p>
                <p className="cost-highlight-sub">₹{settings?.costPerKm ?? 10}/km × {routeInfo.distanceKm.toFixed(1)} km</p>
              </div>
            </div>

            <div>
              <p className="map-label">Road Route (OSRM)</p>
              <div id="summary-map" className="summary-map-box" />
            </div>
          </div>

          <div className="form-actions flex flex-col-reverse sm:flex-row gap-3 mt-8">
            <button className="secondary-btn w-full sm:w-auto" onClick={() => setCurrentStep(3)}>Back</button>
            <button className="accent-btn w-full sm:w-auto" onClick={() => setCurrentStep(5)}>Proceed to Payment</button>
          </div>
        </div>
      )}

      {/* ── STEP 5 ── */}
      {currentStep === 5 && (
        <div className="form-card slide-in">
          <h2>Payment</h2>
          <div className="payment-header">
            <p className="payment-label">Amount to pay</p>
            <p className="payment-amount">₹{routeInfo?.cost.toFixed(2)}</p>
            <p className="payment-route">{pickupCity?.city} to {deliveryCity?.city} · {routeInfo?.distanceKm.toFixed(1)} km</p>
          </div>

          <div className="payment-options">
            {[
              { value: "UPI", label: "UPI",                sub: "GPay · PhonePe · Paytm" },
              { value: "Card", label: "Credit / Debit Card", sub: "Visa · Mastercard · RuPay" },
              { value: "NetBanking", label: "Net Banking",   sub: "All major Indian banks" },
              { value: "COD", label: "Cash on Delivery",      sub: "Pay when you receive" },
            ].map(({ value, label, sub }) => (
              <label key={value} htmlFor={`pay-${value}`} className={`payment-option ${paymentMethod === value ? "selected" : ""}`}>
                <input id={`pay-${value}`} type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} />
                <div>
                  <p className="payment-option-label">{label}</p>
                  <p className="payment-option-sub">{sub}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="form-actions flex flex-col-reverse sm:flex-row gap-3 mt-8">
            <button className="secondary-btn w-full sm:w-auto" onClick={() => setCurrentStep(4)} disabled={isSubmitting}>Back</button>
            <button className="primary-btn w-full sm:w-auto" onClick={handleConfirmOrder} disabled={!paymentMethod || isSubmitting} style={{ minWidth: "180px" }}>
              {isSubmitting ? "Placing order..." : "Confirm and Pay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
