import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      <div className="landing-container">
        {/* Left Side */}
        <div className="landing-content">
          <h1 className="landing-title">
            Send anything, anywhere from your doorstep
          </h1>
          <p className="landing-subtitle">
            Reliable, fast, and secure delivery across Tamil Nadu. Whether it's a small parcel or a heavy courier, we've got you covered.
          </p>
          
          <div className="landing-features">
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">•</span>
              <div className="feature-text">
                <h4>Lightning Fast</h4>
                <p>Same-day and next-day options</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">•</span>
              <div className="feature-text">
                <h4>Fully Secure</h4>
                <p>Real-time tracking & insured packages</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">•</span>
              <div className="feature-text">
                <h4>Best Rates</h4>
                <p>Transparent pricing with no hidden fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Quick Start Card */}
        <div className="landing-action-card">
          <div className="quick-start-card">
            <h3>Quick Start</h3>
            <p className="card-sub">Enter pincodes to get started</p>
            
            <div className="input-group">
              <label>Pickup Pincode</label>
              <input
                type="text"
                placeholder="e.g. 600001"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                maxLength={6}
              />
            </div>
            
            <div className="input-group">
              <label>Delivery Pincode</label>
              <input
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
