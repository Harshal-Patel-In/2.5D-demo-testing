import React, { useState, useEffect } from 'react';
import './ParallaxStudioHUD.css';

/**
 * Parallax Studio HUD v2.0 (The Framefields Paradigm)
 */
export function ParallaxStudioHUD({
  telemetry,
  onTelemetryChange,
  onFinalize,
  notes = [],
  onAddNote,
  particleStyle = 'smoke',
  onParticleStyleChange,
  gyro,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [isPinMode, setIsPinMode] = useState(false);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [noteText, setNoteText] = useState('');
  const [pendingPin, setPendingPin] = useState(null);

  useEffect(() => {
    if (!isPinMode) return;

    const handleCanvasClick = (e) => {
      if (e.target.closest('#parallax-studio-hud')) return;

      const normX = parseFloat((e.clientX / window.innerWidth).toFixed(3));
      const normY = parseFloat((e.clientY / window.innerHeight).toFixed(3));
      setPendingPin({ x: normX, y: normY });
      setActiveTab('annotations');
    };

    window.addEventListener('click', handleCanvasClick);
    return () => window.removeEventListener('click', handleCanvasClick);
  }, [isPinMode]);

  const handleSaveAndSync = async () => {
    setSyncStatus('Syncing to agent...');

    const payload = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      telemetry,
      particleStyle,
      notes,
    };

    const triggerLocalSave = () => {
      localStorage.setItem('parallax_session_telemetry', JSON.stringify(payload));
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'session.json';
      a.click();
      URL.revokeObjectURL(url);
      setSyncStatus('✓ Saved session.json (Downloaded)');
      setTimeout(() => setSyncStatus('Idle'), 3000);
    };

    try {
      const res = await fetch('/api/parallax/save-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSyncStatus('✓ Synced to .parallax/session.json');
        setTimeout(() => setSyncStatus('Idle'), 3000);
      } else {
        triggerLocalSave();
      }
    } catch {
      triggerLocalSave();
    }
  };

  const handleCreateNote = () => {
    if (!pendingPin || !noteText.trim()) return;
    const newNote = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      x: pendingPin.x,
      y: pendingPin.y,
      text: noteText.trim(),
      resolved: false,
    };
    if (onAddNote) onAddNote(newNote);
    setPendingPin(null);
    setNoteText('');
    setIsPinMode(false);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="hud-open-btn">
        ⚙ Open Studio HUD
      </button>
    );
  }

  return (
    <aside id="parallax-studio-hud">
      {/* HUD Header */}
      <div className="hud-header">
        <div className="hud-title-wrap">
          <span className="hud-pulse-dot" />
          <h3 className="hud-title">Parallax Studio</h3>
          <span className="hud-version-badge">v2.0</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hud-close-btn">
          ✕
        </button>
      </div>

      {/* Real Hardware Gyroscope Controller */}
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={gyro?.startGyro}
          style={{
            width: '100%',
            padding: '7px 10px',
            background: gyro?.gyroActive
              ? 'linear-gradient(135deg, #059669, #047857)'
              : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
          }}
        >
          <span>📱</span>
          <span>
            {gyro?.gyroActive
              ? `✓ Gyro Active (R:${gyro.rawAngles.gamma}°, P:${gyro.rawAngles.beta}°)`
              : 'Enable Real Hardware Gyroscope'}
          </span>
        </button>

        {gyro?.errorMsg && (
          <p style={{ color: '#f87171', fontSize: '10px', marginTop: '4px', textAlign: 'center', fontFamily: 'monospace' }}>
            ⚠️ {gyro.errorMsg}
          </p>
        )}
      </div>

      {/* Mode Navigation Tabs */}
      <div className="hud-tabs">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`hud-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
        >
          Sliders
        </button>
        <button
          onClick={() => setActiveTab('annotations')}
          className={`hud-tab ${activeTab === 'annotations' ? 'active' : ''}`}
        >
          <span>Notes</span>
          {notes.length > 0 && (
            <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: '10px', fontSize: '9px' }}>
              {notes.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Live Telemetry Controls */}
      {activeTab === 'telemetry' && (
        <section>
          {/* Tracking Mode Status Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '10px' }}>
            <span style={{ color: '#71717a' }}>Hardware Sensor:</span>
            <span style={{ color: gyro?.gyroActive ? '#34d399' : '#a1a1aa', fontWeight: 600 }}>
              {gyro?.gyroActive ? 'Connected & Reading' : 'Mouse / Touch Fallback'}
            </span>
          </div>

          {/* Display Mode: Cover vs Fit */}
          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Display Framing</span>
              <span className="hud-val">{telemetry.displayMode === 'fit' ? 'Fit (Contain)' : 'Cover (Full Screen)'}</span>
            </div>
            <div className="hud-toggle-group">
              <button
                type="button"
                onClick={() => {
                  onTelemetryChange('displayMode', 'cover');
                  onTelemetryChange('zoom', 1.0);
                }}
                className={`hud-toggle-btn ${telemetry.displayMode !== 'fit' ? 'active' : ''}`}
              >
                Cover (Edge-to-Edge)
              </button>
              <button
                type="button"
                onClick={() => {
                  onTelemetryChange('displayMode', 'fit');
                  onTelemetryChange('zoom', 1.0);
                }}
                className={`hud-toggle-btn ${telemetry.displayMode === 'fit' ? 'active' : ''}`}
              >
                Fit (Square Art)
              </button>
            </div>
          </div>

          {/* Camera Zoom Control */}
          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Zoom Scale</span>
              <span className="hud-val">{((telemetry.zoom ?? 1.0) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.6"
              step="0.02"
              value={telemetry.zoom ?? 1.0}
              onChange={(e) => onTelemetryChange('zoom', parseFloat(e.target.value))}
              className="hud-slider"
            />
          </div>

          {/* Atmospheric Particles Style */}
          {onParticleStyleChange && (
            <div className="hud-control-group">
              <div className="hud-label-row">
                <span>Particles</span>
                <span className="hud-val">{particleStyle}</span>
              </div>
              <div className="hud-toggle-group">
                <button
                  type="button"
                  onClick={() => onParticleStyleChange('smoke')}
                  className={`hud-toggle-btn ${particleStyle === 'smoke' ? 'active' : ''}`}
                >
                  Smoke/Ash
                </button>
                <button
                  type="button"
                  onClick={() => onParticleStyleChange('petals')}
                  className={`hud-toggle-btn ${particleStyle === 'petals' ? 'active' : ''}`}
                >
                  Sakura
                </button>
                <button
                  type="button"
                  onClick={() => onParticleStyleChange('fireflies')}
                  className={`hud-toggle-btn ${particleStyle === 'fireflies' ? 'active' : ''}`}
                >
                  Sparks
                </button>
                <button
                  type="button"
                  onClick={() => onParticleStyleChange('none')}
                  className={`hud-toggle-btn ${particleStyle === 'none' ? 'active' : ''}`}
                >
                  None
                </button>
              </div>
            </div>
          )}

          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Focal Target (Z-Depth)</span>
              <span className="hud-val">{telemetry.focalTargetZ?.toFixed(1) ?? '32.0'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={telemetry.focalTargetZ ?? 32.0}
              onChange={(e) => onTelemetryChange('focalTargetZ', parseFloat(e.target.value))}
              className="hud-slider"
            />
          </div>

          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Bokeh Scale (DoF Blur)</span>
              <span className="hud-val">{telemetry.bokehScale?.toFixed(1) ?? '0.5'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={telemetry.bokehScale ?? 0.5}
              onChange={(e) => onTelemetryChange('bokehScale', parseFloat(e.target.value))}
              className="hud-slider"
            />
          </div>

          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Wind Sway Amplitude</span>
              <span className="hud-val">{((telemetry.windSway ?? 1.7) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={telemetry.windSway ?? 1.7}
              onChange={(e) => onTelemetryChange('windSway', parseFloat(e.target.value))}
              className="hud-slider"
            />
          </div>

          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Inertial Damping (α)</span>
              <span className="hud-val">{telemetry.lerpAlpha?.toFixed(3) ?? '0.080'}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.3"
              step="0.005"
              value={telemetry.lerpAlpha ?? 0.08}
              onChange={(e) => onTelemetryChange('lerpAlpha', parseFloat(e.target.value))}
              className="hud-slider"
            />
          </div>

          <div className="hud-control-group">
            <div className="hud-label-row">
              <span>Texture Filtering</span>
              <span className="hud-val">{telemetry.smoothing ? 'Smooth (Linear)' : 'Crisp (Nearest)'}</span>
            </div>
            <div className="hud-toggle-group">
              <button
                type="button"
                onClick={() => onTelemetryChange('smoothing', false)}
                className={`hud-toggle-btn ${!telemetry.smoothing ? 'active' : ''}`}
              >
                Crisp
              </button>
              <button
                type="button"
                onClick={() => onTelemetryChange('smoothing', true)}
                className={`hud-toggle-btn ${telemetry.smoothing ? 'active' : ''}`}
              >
                Smooth
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Spatial Pin Annotations (Framefields Loop) */}
      {activeTab === 'annotations' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#a1a1aa', fontSize: '11px' }}>Click Canvas to Pin</span>
            <button
              onClick={() => setIsPinMode(!isPinMode)}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                cursor: 'pointer',
                background: isPinMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: isPinMode ? '#fca5a5' : '#e4e4e7',
                border: isPinMode ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {isPinMode ? '📍 Pinning Active' : '+ Enable Pin Tool'}
            </button>
          </div>

          {pendingPin && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#f59e0b', fontFamily: 'monospace', marginBottom: '6px' }}>
                <span>Pinned Location:</span>
                <span>X:{pendingPin.x} Y:{pendingPin.y}</span>
              </div>
              <textarea
                placeholder="What needs fixing here?"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '11px', outline: 'none' }}
                rows={2}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  onClick={handleCreateNote}
                  style={{ flex: 1, padding: '4px 8px', background: '#f59e0b', color: '#09090b', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                >
                  Save Pin Note
                </button>
                <button
                  onClick={() => setPendingPin(null)}
                  style={{ padding: '4px 8px', background: 'rgba(255, 255, 255, 0.1)', color: '#a1a1aa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {notes.length === 0 && !pendingPin && (
              <p style={{ color: '#71717a', fontStyle: 'italic', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                No critique notes recorded yet.
              </p>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  background: note.resolved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  border: note.resolved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  display: 'flex',
                  gap: '6px',
                }}
              >
                <span>{note.resolved ? '✅' : '📍'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#e4e4e7', fontSize: '11px', wordBreak: 'break-word' }}>{note.text}</p>
                  <span style={{ fontSize: '9px', color: note.resolved ? '#34d399' : '#71717a', fontFamily: 'monospace' }}>
                    {note.resolved ? 'Resolved' : `Coord: (${note.x}, ${note.y})`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button onClick={handleSaveAndSync} className="hud-btn-primary">
          <span>💾</span>
          <span>Save & Sync with Agent</span>
        </button>
        <button onClick={onFinalize} className="hud-btn-secondary">
          ✨ Finalize & Clean Export
        </button>
      </div>

      {syncStatus !== 'Idle' && (
        <p className="hud-sync-status">{syncStatus}</p>
      )}
    </aside>
  );
}
