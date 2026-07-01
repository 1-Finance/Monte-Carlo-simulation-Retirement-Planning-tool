import React from 'react';
import { Loader2 } from 'lucide-react';

interface SimulationProgressProps {
  current: number;
  total: number;
  percentage: number;
}

export function SimulationProgress({ current, total, percentage }: SimulationProgressProps) {
  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="animate-pulse-glow" style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'rgba(79,143,255,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={20} color="var(--color-accent-blue)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <div>
          <h4 style={{ marginBottom: '0.125rem' }}>Running Monte Carlo Simulation</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Processing {current.toLocaleString()} of {total.toLocaleString()} simulations
          </p>
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: '1.5rem', fontWeight: 800,
          background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
        This may take a few moments. The simulation runs entirely in your browser.
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
