import { useState } from 'react'
import './App.css';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep'
];

const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Barley', 'Millet', 'Pulses', 'Chickpea', 
  'Lentil', 'Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Cotton', 
  'Sugarcane', 'Jute', 'Tea', 'Coffee', 'Tomato', 'Potato', 'Onion', 
  'Brinjal', 'Cauliflower', 'Mango', 'Banana', 'Papaya', 'Guava', 'Grapes'
];

// Replace with your actual API key - make sure it's valid and has proper permissions
const GEMINI_API_KEY = 'AIzaSyD5f0dfrcFHrfvS34_Lg930I8d_Eb7Y-M4';

async function getGeminiOverview(n, p, k, region, date, crop) {
  const prompt = `For a '${crop}' crop in the state of ${region}, India, around the date ${date}, with current soil NPK (N: ${n}, P: ${p}, K: ${k}):
  ANSWER IN BRIEF AND TO THE POINT
1. What are the optimal/suggested nutrient levels? Include N, P, K, pH, and Moisture.
2. Which crops are best suited to grow here if the npk values are greater than the optimal values?
Please answer in this format:
Suggested Levels: N: <value>, P: <value>, K: <value>, pH: <value>, Moisture: <value>%
Overview: <brief overview/actions>`;

  try {
    console.log('Making API request to Gemini...');
    
    // Try the updated model first
    let response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: prompt }] 
        }]
      })
    });

    // If that fails, try the pro model
    if (!response.ok) {
      console.log('Flash model failed, trying Pro model...');
      response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }] 
          }]
        })
      });
    }

    // If both fail, try the legacy model
    if (!response.ok) {
      console.log('Pro model failed, trying legacy gemini-pro...');
      response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }] 
          }]
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return `API Error (${response.status}): ${errorText}`;
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.error) {
      return `API Error: ${data.error.message}`;
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No overview available.";
    
  } catch (error) {
    console.error('Network or parsing error:', error);
    return `Error: ${error.message}. This might be due to CORS restrictions when running in browser. Consider using a backend proxy or testing the API key separately.`;
  }
}

// Mock function for testing without API
function getMockOverview(n, p, k, region, date) {
  return `Based on soil NPK values (N: ${n}, P: ${p}, K: ${k}) in ${region} for date ${date}:

Crops: Rice, Wheat, Sugarcane, Cotton (for high nitrogen), Legumes like Chickpea, Lentils (for nitrogen fixation), Vegetables like Tomato, Potato

Suggested NPK: N: ${Math.max(50, parseInt(n) + 10)}, P: ${Math.max(30, parseInt(p) + 5)}, K: ${Math.max(150, parseInt(k) + 20)}

Note: This is mock data for testing. Enable API for real recommendations.`;
}

function extractSuggestedValues(aiText) {
  const match = aiText.match(/Suggested Levels:.*?N:\s*([\d.]+).*?P:\s*([\d.]+).*?K:\s*([\d.]+).*?pH:\s*([\d.-]+).*?Moisture:\s*([\d.]+)/i);
  if (match) {
    return {
      N: match[1],
      P: match[2],
      K: match[3],
      ph: match[4],
      moisture: match[5]
    };
  }
  return null;
}

export default function App() {
  const [inputs, setInputs] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    moisture: ''
  });
  const [current, setCurrent] = useState({ N: 0, P: 0, K: 0, ph: '-', moisture: '-' });
  const [selectedState, setSelectedState] = useState('Delhi');
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [selectedDate, setSelectedDate] = useState('');
  const [aiOverview, setAiOverview] = useState('');
  const [suggestedLevels, setSuggestedLevels] = useState({ N: 50, P: 30, K: 150, ph: '6.5-7.5', moisture: '60' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
  };

  const handleCropChange = (e) => {
    setSelectedCrop(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCurrent({
      N: inputs.nitrogen || 0,
      P: inputs.phosphorus || 0,
      K: inputs.potassium || 0,
      ph: inputs.ph || '-',
      moisture: inputs.moisture || '-'
    });
    setAiOverview('');
    setLoading(true);
    
    try {
      const overview = await getGeminiOverview(
        inputs.nitrogen || 0,
        inputs.phosphorus || 0,
        inputs.potassium || 0,
        selectedState,
        selectedDate || new Date().toISOString().slice(0, 10),
        selectedCrop
      );
      
      setAiOverview(overview);
      const levels = extractSuggestedValues(overview);
      if (levels) {
        setSuggestedLevels(levels);
      }
    } catch (error) {
      setAiOverview(`Unexpected error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleNutrientRelease = (nutrient) => {
    alert(`Releasing ${nutrient}...`);
    // Add your nutrient release logic here
  };

  const testApiKey = async () => {
    setLoading(true);
    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
      const result = await testResponse.text();
      alert(testResponse.ok ? 'API Key is working!' : `API Key Error: ${result}`);
    } catch (error) {
      alert(`Network Error: ${error.message}`);
    }
    setLoading(false);
  };

  // Inline styles to match your CSS
  const styles = {
    body: {
      background: '#f7f7f7',
      minHeight: '100vh',
      margin: 0,
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: '#4caf50'
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2rem',
      textAlign: 'center'
    },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      textAlign: 'left',
      color: '#4caf50'
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      textAlign: 'left'
    },
    card: {
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(235, 219, 219, 0.04)',
      padding: '2em',
      margin: '2em auto',
      maxWidth: '900px',
      textAlign: 'left'
    },
    inputRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '0.75em'
    },
    label: {
      width: '180px',
      marginBottom: 0,
      fontWeight: '500',
      textAlign: 'left'
    },
    input: {
      width: '60%',
      marginLeft: '1em',
      marginBottom: 0,
      background: '#fff',
      color: '#222',
      border: '1px solid #ccc',
      borderRadius: '6px',
      padding: '0.5em',
      colorScheme: 'light'
    },
    select: {
      width: '62%',
      marginLeft: '1em',
      background: '#fff',
      color: '#222',
      border: '1px solid #ccc',
      borderRadius: '6px',
      padding: '0.5em'
    },
    submitButton: {
      width: '100%',
      background: loading ? '#ccc' : '#4caf50',
      color: '#fff',
      border: '1px solid #388e3c',
      borderRadius: '7px',
      padding: '0.9em 0',
      fontSize: '1.1rem',
      fontWeight: '500',
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '1rem',
      marginBottom: '0.5rem',
      transition: 'background 0.2s, border 0.2s'
    },
    testButton: {
      width: '48%',
      background: '#2196f3',
      color: '#fff',
      border: '1px solid #1976d2',
      borderRadius: '7px',
      padding: '0.6em 0',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      margin: '0.5rem 1% 0.5rem 0',
      transition: 'background 0.2s, border 0.2s'
    },
    greenBtn: {
      width: '100%',
      background: '#4caf50',
      color: '#fff',
      border: '1px solid #388e3c',
      borderRadius: '7px',
      padding: '0.9em 0',
      fontSize: '1.1rem',
      fontWeight: '500',
      cursor: 'pointer',
      marginTop: '1rem',
      marginBottom: '0.5rem',
      transition: 'background 0.2s, border 0.2s'
    },
    checkboxRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1rem',
      fontSize: '0.9rem'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginTop: '2rem',
      marginBottom: '0.5rem',
      color: '#4caf50'
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Soil Nutrient Management</h1>
        
        <div style={styles.card}>
          <form className="input-section" onSubmit={handleSubmit}>
            <h2 style={styles.h2}>Input Nutrient Levels</h2>
            
            <div style={styles.inputRow}>
              <label htmlFor="nitrogen" style={styles.label}>Nitrogen (mg/kg):</label>
              <input 
                type="number" 
                id="nitrogen" 
                placeholder="Enter nitrogen level" 
                value={inputs.nitrogen} 
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.inputRow}>
              <label htmlFor="phosphorus" style={styles.label}>Phosphorus (mg/kg):</label>
              <input 
                type="number" 
                id="phosphorus" 
                placeholder="Enter phosphorus level" 
                value={inputs.phosphorus} 
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.inputRow}>
              <label htmlFor="potassium" style={styles.label}>Potassium (mg/kg):</label>
              <input 
                type="number" 
                id="potassium" 
                placeholder="Enter potassium level" 
                value={inputs.potassium} 
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.inputRow}>
              <label htmlFor="ph" style={styles.label}>pH Level:</label>
              <input 
                type="number" 
                step="0.01" 
                id="ph" 
                placeholder="Enter pH level" 
                value={inputs.ph} 
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.inputRow}>
              <label htmlFor="moisture" style={styles.label}>Moisture:</label>
              <input 
                type="number" 
                id="moisture" 
                placeholder="Enter moisture" 
                value={inputs.moisture} 
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputRow}>
              <label htmlFor="crop" style={styles.label}>Crop:</label>
              <select 
                id="crop" 
                value={selectedCrop} 
                onChange={handleCropChange}
                style={styles.select}
              >
                {CROPS.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.inputRow}>
              <label htmlFor="state" style={styles.label}>State:</label>
              <select 
                id="state" 
                value={selectedState} 
                onChange={handleStateChange}
                style={styles.select}
              >
                {STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.inputRow}>
              <label htmlFor="date" style={styles.label}>Date:</label>
              <input 
                type="date" 
                id="date" 
                value={selectedDate} 
                onChange={handleDateChange}
                style={styles.input}
              />
            </div>
            
            <button 
              id="submit"
              type="submit"
              disabled={loading}
              style={styles.submitButton}
              onMouseOver={(e) => {
                if (!loading) e.target.style.background = '#388e3c';
              }}
              onMouseOut={(e) => {
                if (!loading) e.target.style.background = '#4caf50';
              }}
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <div className="output-section">
            <h2 style={styles.h2}>Current Nutrient Levels</h2>
            <p id="current-nutrients">N: {current.N} mg/kg, <br></br> P: {current.P} mg/kg, <br></br> K: {current.K} mg/kg, <br></br> ph: {current.ph}, <br></br> Moisture: {current.moisture} % </p>
            
            <h2 style={styles.h2}>Suggested Nutrient Levels</h2>
            <p id="suggested-nutrients">N: {suggestedLevels.N} mg/kg,<br></br>  P: {suggestedLevels.P} mg/kg,<br></br>  K: {suggestedLevels.K} mg/kg, <br></br> pH Level: {suggestedLevels.ph}, <br></br>Moisture: {suggestedLevels.moisture} %</p>
          </div>
        </div>

        <div style={styles.card}>
          <div className="control-section">
            <h2 style={styles.h2}>Control Nutrient Release</h2>
            <button 
              id="release-nitrogen" 
              onClick={() => handleNutrientRelease('Nitrogen')}
              style={styles.greenBtn}
              onMouseOver={(e) => e.target.style.background = '#388e3c'}
              onMouseOut={(e) => e.target.style.background = '#4caf50'}
            >
              Release Nitrogen
            </button>
            <button 
              id="release-phosphorus" 
              onClick={() => handleNutrientRelease('Phosphorus')}
              style={styles.greenBtn}
              onMouseOver={(e) => e.target.style.background = '#388e3c'}
              onMouseOut={(e) => e.target.style.background = '#4caf50'}
            >
              Release Phosphorus
            </button>
            <button 
              id="release-potassium" 
              onClick={() => handleNutrientRelease('Potassium')}
              style={styles.greenBtn}
              onMouseOver={(e) => e.target.style.background = '#388e3c'}
              onMouseOut={(e) => e.target.style.background = '#4caf50'}
            >
              Release Potassium
            </button>
            <button 
              id="release-potassium" 
              onClick={() => handleNutrientRelease('Potassium')}
              style={styles.greenBtn}
              onMouseOver={(e) => e.target.style.background = '#388e3c'}
              onMouseOut={(e) => e.target.style.background = '#4caf50'}
            >
              Control pH value
            </button>
            <button 
              id="release-potassium" 
              onClick={() => handleNutrientRelease('Potassium')}
              style={styles.greenBtn}
              onMouseOver={(e) => e.target.style.background = '#388e3c'}
              onMouseOut={(e) => e.target.style.background = '#4caf50'}
            >
              Control Water content
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div className="ai-overview-section">
            <h2 style={styles.h2}>AI Crop Overview</h2>
            {loading ? (
              <p>Loading AI overview...</p>
            ) : (
              <div>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', background: aiOverview.includes('Error') ? '#ffebee' : 'transparent', padding: aiOverview.includes('Error') ? '1rem' : '0', borderRadius: '4px', border: aiOverview.includes('Error') ? '1px solid #ffcdd2' : 'none' }}>
                  {aiOverview || 'Enter soil data and click Submit to get AI-powered crop recommendations.'}
                </p>
                {aiOverview.includes('Error') && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #bbdefb' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Troubleshooting Tips:</h3>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      <li>Check if your API key is valid and has proper permissions</li>
                      <li>Try the "Test API Key" button to verify connectivity</li>
                      <li>Enable "Use mock data" checkbox for testing without API</li>
                      <li>Check browser console for detailed error messages</li>
                      <li>Consider implementing a backend proxy to avoid CORS issues</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}