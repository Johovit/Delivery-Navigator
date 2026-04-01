import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldCheck, BadgeDollarSign } from "lucide-react";
function Dashboard() {
  const navigate = useNavigate();
  const [pickupPincode, setPickupPincode] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");

  const handleBookNow = () => {
    navigate("/create-order", {
      state: { pickupPincode, deliveryPincode },
    });
  };

  return (
    <div className="page dashboard-landing">
      <div className="landing-container flex flex-col lg:flex-row items-start gap-8 lg:gap-12 w-full">
        {/* Left Side */}
        <div className="landing-content flex-1 w-full max-w-full lg:max-w-2xl">
          <h1 className="landing-title text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
            Send anything, anywhere from your doorstep
          </h1>
          <p className="landing-subtitle">
            Reliable, fast, and secure delivery across Tamil Nadu. Whether it's a small parcel or a heavy courier, we've got you covered.
          </p>
          
          <div className="landing-features flex flex-col sm:flex-row lg:flex-col gap-6 sm:gap-4 lg:gap-6 mt-8">
            <div className="feature-item flex items-start gap-3">
              <Zap size={24} className="feature-icon mt-1 text-indigo-600" aria-hidden="true" />
              <div className="feature-text">
                <h4>Lightning Fast</h4>
                <p>Same-day and next-day options</p>
              </div>
            </div>
            <div className="feature-item flex items-start gap-3">
              <ShieldCheck size={24} className="feature-icon mt-1 text-indigo-600" aria-hidden="true" />
              <div className="feature-text">
                <h4>Fully Secure</h4>
                <p>Real-time tracking & insured packages</p>
              </div>
            </div>
            <div className="feature-item flex items-start gap-3">
              <BadgeDollarSign size={24} className="feature-icon mt-1 text-indigo-600" aria-hidden="true" />
              <div className="feature-text">
                <h4>Best Rates</h4>
                <p>Transparent pricing with no hidden fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Quick Start Card */}
        <div className="landing-action-card w-full lg:w-[420px] shrink-0 mt-8 lg:mt-0">
          <div className="quick-start-card card w-full">
            <h3>Quick Start</h3>
            <p className="card-sub">Enter pincodes to get started</p>
            
            <div className="input-group">
              <label htmlFor="pickup-pincode">Pickup Pincode</label>
              <input
                id="pickup-pincode"
                name="pickupPincode"
                autoComplete="postal-code"
                type="text"
                placeholder="e.g. 600001"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                maxLength={6}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="delivery-pincode">Delivery Pincode</label>
              <input
                id="delivery-pincode"
                name="deliveryPincode"
                autoComplete="postal-code"
                type="text"
                placeholder="e.g. 641001"
                value={deliveryPincode}
                onChange={(e) => setDeliveryPincode(e.target.value)}
                maxLength={6}
              />
            </div>

            <button 
              className="accent-btn book-now-btn" 
              onClick={handleBookNow}
              disabled={!pickupPincode || !deliveryPincode}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
