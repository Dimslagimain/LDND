'use client'

import { useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import type { DashboardData } from '@/lib/types'
import { MS_PER_DAY } from '@/lib/constants'
import { COLORS, GA_TYPES, QG_TYPES } from '../constants'
import { AIRLINES } from '@/lib/constants'

/* ── Aircraft Type Vertical Row ── */
function TypeRow({ type, count, isDanger }: { type: string; count: number; isDanger: boolean }) {
    const safe = count === 0

    if (safe) {
        return (
            <div style={{
                border: `1px solid ${COLORS.border}`, background: COLORS.surface,
                borderRadius: 8, padding: '8px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{ color: COLORS.muted, fontSize: 12, fontWeight: 600 }}>{type}</span>
                <span style={{ color: COLORS.light, fontSize: 13, fontWeight: 700 }}>{count}</span>
            </div>
        )
    }

    const bg = isDanger ? COLORS.dangerLight : COLORS.warningLight
    const border = isDanger ? COLORS.dangerBorder : COLORS.warningBorder
    const numClr = isDanger ? COLORS.danger : COLORS.warning
    const lblClr = isDanger ? COLORS.dangerDark : COLORS.warningDark

    return (
        <div style={{
            border: `1px solid ${border}`, background: bg,
            borderRadius: 8, padding: '8px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
            <span style={{ color: lblClr, fontSize: 12, fontWeight: 700 }}>{type}</span>
            <span style={{ color: numClr, fontSize: 14, fontWeight: 800 }}>{count}</span>
        </div>
    )
}

/* ── Airline Column (GA / QG) ── */
function AirlineColumn({ name, badge, color, items, isDanger, types, showUnderseat = true }: {
    name: string; badge: string; color: string;
    items: DashboardData['nearDueItems']
    isDanger: boolean; types: string[]; showUnderseat?: boolean
}) {
    return (
        <div style={{ background: COLORS.borderLight, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color }}>{name}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: COLORS.border, color: COLORS.muted, fontWeight: 700 }}>{badge}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showUnderseat ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', gap: 16 }}>
                {/* Aisle */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.blue }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Aisle Carpet</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {types.map(t => {
                            const count = items.filter(i => i.carpetType === 'Aisle' && i.aircraft?.acType === t).length
                            return <TypeRow key={t} type={t} count={count} isDanger={isDanger} />
                        })}
                    </div>
                </div>

                {/* Underseat */}
                {showUnderseat && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.green }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Underseat</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {types.map(t => {
                                const count = items.filter(i => i.carpetType === 'Underseat' && i.aircraft?.acType === t).length
                                return <TypeRow key={t} type={t} count={count} isDanger={isDanger} />
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ── Detail table ── */
function DetailTable({ items }: { items: DashboardData['nearDueItems'] }) {
    const [open, setOpen] = useState(false)
    if (!items.length) return null

    const sorted = [...items].sort((a, b) =>
        new Date(a.nextDue ?? '').getTime() - new Date(b.nextDue ?? '').getTime()
    )

    return (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: COLORS.blue, fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}
            >
                <span style={{ fontSize: 10, display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
                {open ? 'Sembunyikan' : 'Lihat'} Detail ({items.length} item)
            </button>

            {open && (
                <div style={{ marginTop: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: COLORS.borderLight, borderBottom: `1px solid ${COLORS.border}` }}>
                                {['Registrasi', 'Tipe A/C', 'Carpet', 'Last Done', 'Next Due', 'Status Due', 'Status Pesawat'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((item, i) => {
                                const days = item.nextDue
                                    ? Math.ceil((new Date(item.nextDue).getTime() - Date.now()) / MS_PER_DAY)
                                    : 0
                                const overdue = days <= 0
                                return (
                                    <tr key={item.id} style={{ background: i % 2 === 0 ? COLORS.surface : COLORS.borderLight, borderBottom: i < sorted.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: COLORS.text }}>{item.aircraft?.registration}</td>
                                        <td style={{ padding: '10px 14px', color: COLORS.muted }}>{item.aircraft?.acType}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                                background: item.carpetType === 'Aisle' ? COLORS.blueLight : COLORS.greenLight,
                                                color: item.carpetType === 'Aisle' ? COLORS.blue : COLORS.green,
                                            }}>{item.carpetType}</span>
                                        </td>
                                        <td style={{ padding: '10px 14px', color: COLORS.muted }}>{item.lastDone ?? '-'}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 600, color: COLORS.text }}>{item.nextDue ?? '-'}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                                background: overdue ? COLORS.dangerLight : COLORS.warningLight,
                                                color: overdue ? COLORS.danger : COLORS.warningDark,
                                            }}>
                                                {overdue ? `${Math.abs(days)}h lewat` : `${days}h lagi`}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                                background: item.acStatus === 'PROLONG' ? COLORS.warningLight : COLORS.greenLight,
                                                color: item.acStatus === 'PROLONG' ? COLORS.warningDark : COLORS.green,
                                                border: `1px solid ${item.acStatus === 'PROLONG' ? COLORS.warningBorder : COLORS.greenBorder}`
                                            }}>
                                                {item.acStatus === 'PROLONG' ? 'PROLONG' : 'ACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

/* ── Status section card ── */
export default function StatusSection({ title, subtitle, icon, accentColor, data, items, isDanger }: {
    title: string; subtitle: string; icon: React.ReactNode; accentColor: string
    data: DashboardData['nearDue'] | DashboardData['alreadyDue']
    items: DashboardData['nearDueItems']
    isDanger: boolean
}) {
    return (
        <div style={{
            background: COLORS.surface,
            borderRadius: 16,
            border: `1px solid ${COLORS.border}`,
            borderLeft: `4px solid ${accentColor}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                    {icon}
                </div>
                <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{title}</h2>
                    <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{subtitle}</p>
                </div>
            </div>
            {/* Body */}
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, marginBottom: 20 }}>
                    <AirlineColumn name={AIRLINES.GA.name} badge="GA" color={COLORS.gaColor} items={items.filter(i => i.aircraft?.airline === 'GA')} isDanger={isDanger} types={GA_TYPES} />
                    <AirlineColumn name={AIRLINES.QG.name} badge="QG" color={COLORS.qgColor} items={items.filter(i => i.aircraft?.airline === 'QG')} isDanger={isDanger} types={QG_TYPES} showUnderseat={false} />
                </div>
                <DetailTable items={items} />
            </div>
        </div>
    )
}
