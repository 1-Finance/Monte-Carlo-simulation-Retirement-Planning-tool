import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface SWRResultItem {
  baseSWR: number;
  survivalRate: number;
  exhaustionProbability: number;
  numFailures: number;
}

interface ResultsSummaryProps {
  results: SWRResultItem[];
  simulationType?: 'expenses' | 'swr';
}

export function ResultsSummary({ results, simulationType = 'swr' }: ResultsSummaryProps) {
  if (results.length === 0) return null;

  const displayResults = simulationType === 'expenses' ? results.slice(0, 1) : results;

  return (
    <div className="glass-card-static animate-slide-up" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'rgba(139,92,246,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart3 size={20} color="var(--color-accent-purple)" />
        </div>
        <div>
          <h3 style={{ marginBottom: '0.125rem' }}>{simulationType === 'expenses' ? 'Simulation Results' : 'Simulation Results by SWR'}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {simulationType === 'expenses' ? 'Survival rates based on your customized expense profile' : 'Survival rates across different Safe Withdrawal Rates'}
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {simulationType === 'swr' && <th>SWR</th>}
              <th>Survival Rate</th>
              <th>Exhaustion Prob.</th>
              <th>Failures</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayResults.map((r) => {
              const isGood = r.survivalRate >= 0.8;
              const isWarning = r.survivalRate >= 0.6 && r.survivalRate < 0.8;
              return (
                <tr key={r.baseSWR}>
                  {simulationType === 'swr' && (
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {(r.baseSWR * 100).toFixed(1)}%
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 60, height: 6, borderRadius: 999,
                        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${r.survivalRate * 100}%`, height: '100%', borderRadius: 999,
                          background: isGood ? 'var(--color-accent-emerald)' : isWarning ? 'var(--color-accent-amber)' : 'var(--color-accent-rose)',
                        }} />
                      </div>
                      <span style={{ fontWeight: 600, color: isGood ? 'var(--color-accent-emerald)' : isWarning ? 'var(--color-accent-amber)' : 'var(--color-accent-rose)' }}>
                        {(r.survivalRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {(r.exhaustionProbability * 100).toFixed(1)}%
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {r.numFailures.toLocaleString()} / 10,000
                  </td>
                  <td>
                    {isGood ? (
                      <span className="badge badge-success">
                        <TrendingUp size={12} /> Safe
                      </span>
                    ) : isWarning ? (
                      <span className="badge badge-warning">
                        <BarChart3 size={12} /> Moderate
                      </span>
                    ) : (
                      <span className="badge badge-error">
                        <TrendingDown size={12} /> Risky
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
