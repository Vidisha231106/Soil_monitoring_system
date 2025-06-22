import { useState } from 'react';

const MOISTURE_MIN = 30;
const MOISTURE_MAX = 60;
const PH_MIN = 6.0;
const PH_MAX = 7.5;

export default function SoilInput() {
  const [inputs, setInputs] = useState({ N: '', P: '', K: '', moisture: '', pH: '' });
  const [action, setAction] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let msg = '';
    const moisture = parseFloat(inputs.moisture);
    const pH = parseFloat(inputs.pH);
    // NPK logic: do nothing for now
    // Moisture logic
    if (!isNaN(moisture)) {
      if (moisture < MOISTURE_MIN) {
        msg += 'Moisture is low. ESP32 will dispatch more water.\n';
      } else if (moisture > MOISTURE_MAX) {
        msg += 'Moisture is high. ESP32 will stop irrigation.\n';
      }
    }
    // pH logic
    if (!isNaN(pH)) {
      if (pH < PH_MIN) {
        msg += 'pH is low. ESP32 will add base to increase pH.\n';
      } else if (pH > PH_MAX) {
        msg += 'pH is high. ESP32 will add acid to decrease pH.\n';
      }
    }
    if (!msg) msg = 'All values are within normal range.';
    setAction(msg);
  };

  return (
    <div className="card">
      <h2>Enter Soil Nutrient Values</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>N: <input type="number" name="N" value={inputs.N} onChange={handleChange} required /></label>
        </div>
        <div>
          <label>P: <input type="number" name="P" value={inputs.P} onChange={handleChange} required /></label>
        </div>
        <div>
          <label>K: <input type="number" name="K" value={inputs.K} onChange={handleChange} required /></label>
        </div>
        <div>
          <label>Moisture: <input type="number" name="moisture" value={inputs.moisture} onChange={handleChange} required /></label>
        </div>
        <div>
          <label>pH: <input type="number" step="0.01" name="pH" value={inputs.pH} onChange={handleChange} required /></label>
        </div>
        <button type="submit">Submit</button>
      </form>
      {action && (
        <div style={{ marginTop: '1em', whiteSpace: 'pre-line' }}>
          <strong>ESP32 Action:</strong>
          <div>{action}</div>
        </div>
      )}
    </div>
  );
} 