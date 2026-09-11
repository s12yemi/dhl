import React from 'react';

export default function MapTracker({ status, senderCity, receiverCity }) {
  // Determine progress percentage
  let progress = 0;
  if (status === 'Booked') progress = 10;
  else if (status === 'Picked Up') progress = 30;
  else if (status === 'In Transit') progress = 60;
  else if (status === 'Out for Delivery') progress = 85;
  else if (status === 'Delivered') progress = 100;

  return (
    <div style={{ marginTop: '2rem', backgroundColor: '#14171d', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Transit Route Map</span>
        <span style={{ color: 'var(--dhl-yellow)', fontSize: '0.9rem' }}>{progress}% Complete</span>
      </h3>
      
      {/* Visual route representation using SVG */}
      <div style={{ position: 'relative', height: '120px', width: '100%' }}>
        <svg style={{ width: '100%', height: '100%' }}>
          {/* Base path line */}
          <line 
            x1="10%" 
            y1="50%" 
            x2="90%" 
            y2="50%" 
            stroke="#2a2f3a" 
            strokeWidth="4" 
            strokeDasharray="5,5" 
          />
          
          {/* Active path line */}
          <line 
            x1="10%" 
            y1="50%" 
            x2={`${10 + progress * 0.8}%`} 
            y2="50%" 
            stroke="var(--dhl-yellow)" 
            strokeWidth="4" 
            style={{ transition: 'x2 1.5s ease-in-out' }}
          />

          {/* Sender Node */}
          <circle cx="10%" cy="50%" r="8" fill="var(--dhl-red)" />
          <text x="10%" y="80%" fill="var(--text-secondary)" fontSize="11" textAnchor="middle">
            {senderCity || 'Origin'}
          </text>

          {/* Recipient Node */}
          <circle cx="90%" cy="50%" r="8" fill={progress === 100 ? 'var(--success)' : '#4b5563'} />
          <text x="90%" y="80%" fill="var(--text-secondary)" fontSize="11" textAnchor="middle">
            {receiverCity || 'Destination'}
          </text>

          {/* Animated Transit Marker (Vehicle) */}
          <g transform={`translate(${10 + progress * 0.8}%, 0)`} style={{ transition: 'transform 1.5s ease-in-out' }}>
            <circle cx="0" cy="50%" r="12" fill="var(--dhl-yellow)" style={{ opacity: 0.2 }} />
            <circle cx="0" cy="50%" r="6" fill="var(--dhl-yellow)" />
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
        <span>Status: <strong>{status}</strong></span>
        {status === 'In Transit' && <span style={{ color: 'var(--dhl-yellow)', animation: 'pulse 1.5s infinite' }}>✈️ Flying to sorting hub</span>}
        {status === 'Delivered' && <span style={{ color: 'var(--success)' }}>✓ Package Delivered Successfully</span>}
      </div>
    </div>
  );
}
