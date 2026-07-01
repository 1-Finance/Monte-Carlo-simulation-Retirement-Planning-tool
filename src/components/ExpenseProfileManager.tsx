import React, { useState } from 'react';
import { Eye, Trash2, X, Users } from 'lucide-react';
import type { UserExpenseRow } from '../engine/excelParser';

interface ExpenseProfileManagerProps {
  profiles: Array<{ name: string; data: UserExpenseRow[] }>;
  selectedProfile: string | null;
  onSelect: (name: string) => void;
  onDelete: (name: string) => void;
}

export function ExpenseProfileManager({ profiles, selectedProfile, onSelect, onDelete }: ExpenseProfileManagerProps) {
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);

  if (profiles.length === 0) return null;

  const viewData = profiles.find(p => p.name === viewingProfile);

  return (
    <>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'rgba(34,211,238,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={20} color="var(--color-accent-cyan)" />
          </div>
          <div>
            <h4>Expense Profiles</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Select a profile for the simulation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {profiles.map((profile) => (
            <div
              key={profile.name}
              onClick={() => onSelect(profile.name)}
              onMouseEnter={() => onSelect(profile.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: `1px solid ${selectedProfile === profile.name ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                background: selectedProfile === profile.name ? 'rgba(79,143,255,0.06)' : 'transparent',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: selectedProfile === profile.name ? 'var(--color-accent-blue)' : 'var(--color-text-muted)',
              }} />
              <span style={{
                flex: 1, fontSize: '0.875rem', fontWeight: 500,
                color: selectedProfile === profile.name ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
              }}>
                {profile.name}
              </span>

              <button
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); setViewingProfile(profile.name); }}
                title="View details"
              >
                <Eye size={14} />
              </button>
              <button
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); onDelete(profile.name); }}
                title="Delete profile"
                style={{ borderColor: 'rgba(244,63,94,0.2)' }}
              >
                <Trash2 size={14} color="var(--color-accent-rose)" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* View Profile Modal */}
      {viewingProfile && viewData && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setViewingProfile(null)}
        >
          <div
            className="glass-card-static"
            style={{
              width: '100%', maxWidth: 500, maxHeight: '70vh',
              padding: '1.5rem', overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4>Profile: {viewingProfile}</h4>
              <button className="btn-icon" onClick={() => setViewingProfile(null)}>
                <X size={16} />
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Age</th>
                  <th style={{ textAlign: 'right' }}>Total Withdrawal</th>
                </tr>
              </thead>
              <tbody>
                {viewData.data.map((row) => (
                  <tr key={row.age}>
                    <td>{row.age}</td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{row.totalWithdrawal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
