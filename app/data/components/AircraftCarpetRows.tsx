'use client'

import { useState, useEffect } from 'react'
import { Trash2, Edit } from 'lucide-react'
import { C, fmtDate, daysUntil } from '../constants'
import { NEAR_DUE_DAYS } from '@/lib/constants'
import { AircraftData, CarpetItemData } from '../types'
import { AddDoneModal, EditDetailsModal, Overlay } from './Modals'

export function AircraftCarpetRows({ ac, onRefresh }: { ac: AircraftData; onRefresh: () => void }) {
    if (ac.carpetItems.length === 0) {
        return (
            <tr style={{ background: C.surface, borderBottom: `4px solid ${C.border}` }}>
                <td style={{ padding: '24px 20px', borderRight: `1px solid ${C.border}`, verticalAlign: 'middle', width: 160 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'monospace', color: C.text }}>{ac.registration}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueLight, padding: '4px 10px', borderRadius: 12, whiteSpace: 'nowrap' }}>{ac.acType}</div>
                        <button onClick={async () => {
                            if (!confirm(`Hapus ${ac.registration}? Semua data akan hilang.`)) return
                            await fetch(`/api/aircraft/${ac.id}`, { method: 'DELETE' })
                            onRefresh()
                        }} style={{ padding: 6, borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus Pesawat">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </td>
                <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: C.muted, fontStyle: 'italic', fontSize: 13 }}>Belum ada data carpet...</td>
            </tr>
        )
    }

    return (
        <>
            {ac.carpetItems.map((ci, index) => (
                <CarpetRow key={ci.id} item={ci} ac={ac} isFirst={index === 0} isLast={index === ac.carpetItems.length - 1} rowSpan={ac.carpetItems.length} onRefresh={onRefresh} />
            ))}
        </>
    )
}

function CarpetRow({ item, ac, isFirst, isLast, rowSpan, onRefresh }: { item: CarpetItemData; ac: AircraftData; isFirst: boolean; isLast: boolean; rowSpan: number; onRefresh: () => void }) {
    const [showDoneModal, setShowDoneModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<string>(item.acStatus ?? 'ACTIVE')
    const [isUpdating, setIsUpdating] = useState(false)

    // Sync state when props change
    if (item.acStatus && item.acStatus !== currentStatus && !isUpdating) {
        setCurrentStatus(item.acStatus)
    }

    const days = daysUntil(item.nextDue)
    const overdue = days !== null && days <= 0
    const nearDue = days !== null && days > 0 && days <= NEAR_DUE_DAYS

    let statusBg = C.greenLight, statusColor = C.green, statusBorder = C.greenBorder, statusText = 'SAFE'
    if (overdue) { statusBg = C.dangerLight; statusColor = C.danger; statusBorder = C.dangerBorder; statusText = 'OVERDUE' }
    else if (nearDue) { statusBg = C.warningLight; statusColor = C.warning; statusBorder = C.warningBorder; statusText = 'NEAR DUE' }

    return (
        <>
            <tr style={{ background: overdue ? C.dangerLight : nearDue ? C.warningLight : C.surface, borderBottom: isLast ? `5px solid ${C.border}` : `1px solid ${C.border}`, transition: 'background 0.2s', fontSize: 13 }}>
                {isFirst && (
                    <td rowSpan={rowSpan} style={{ padding: '24px 20px', borderRight: `1px solid ${C.border}`, verticalAlign: 'middle', background: C.surface, width: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'monospace', color: C.text }}>{ac.registration}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueLight, padding: '4px 10px', borderRadius: 12, whiteSpace: 'nowrap' }}>{ac.acType}</div>
                            <button onClick={async () => {
                                if (!confirm(`Hapus ${ac.registration}? Semua data akan hilang.`)) return
                                await fetch(`/api/aircraft/${ac.id}`, { method: 'DELETE' })
                                onRefresh()
                            }} style={{ padding: 6, borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus Pesawat">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </td>
                )}
                <td style={{ padding: '10px 16px', fontWeight: 700, color: C.text }}>
                    {item.carpetType}
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginTop: 2 }}>{item.intervalMonths} bln</div>
                </td>
                <td style={{ padding: '10px 16px' }}>
                    <span style={{
                        display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`
                    }}>{statusText}</span>
                </td>
                <td style={{ padding: '10px 16px', color: C.text, whiteSpace: 'nowrap' }}>
                    {item.lastDone ? fmtDate(item.lastDone) : <span style={{ color: C.light }}>—</span>}
                </td>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: overdue ? C.danger : nearDue ? C.warning : C.text, whiteSpace: 'nowrap' }}>
                    {fmtDate(item.nextDue)}
                </td>
                <td style={{ padding: '10px 16px', color: item.vendor ? C.text : C.light }}>{item.vendor || '—'}</td>
                <td style={{ padding: '10px 16px', color: item.coatroom ? C.text : C.light }}>{item.coatroom || '—'}</td>
                <td style={{ padding: '10px 16px', color: C.text, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.remark || ''}>
                    {item.remark || <span style={{ color: C.light }}>—</span>}
                </td>
                <td style={{ padding: '10px 16px' }}>
                    <button
                        disabled={isUpdating}
                        onClick={async () => {
                            const newStatus = currentStatus === 'PROLONG' ? 'ACTIVE' : 'PROLONG'
                            setCurrentStatus(newStatus)
                            setIsUpdating(true)
                            try {
                                const res = await fetch(`/api/carpet-items/${item.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ acStatus: newStatus }),
                                })
                                if (!res.ok) {
                                    setCurrentStatus(currentStatus) // revert back on failure
                                } else {
                                    onRefresh()
                                }
                            } catch (err) {
                                console.error('Failed to toggle status:', err)
                                setCurrentStatus(currentStatus) // revert back on error
                            } finally {
                                setIsUpdating(false)
                            }
                        }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                            background: currentStatus === 'PROLONG' ? C.warningLight : C.greenLight,
                            color: currentStatus === 'PROLONG' ? C.warningDark : C.green,
                            border: `1px solid ${currentStatus === 'PROLONG' ? C.warningBorder : C.greenBorder}`,
                            cursor: isUpdating ? 'wait' : 'pointer',
                            opacity: isUpdating ? 0.7 : 1,
                            outline: 'none', transition: 'all 0.2s ease'
                        }}
                        title="Klik untuk mengubah status"
                    >
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: currentStatus === 'PROLONG' ? C.warningDark : C.green
                        }} />
                        {currentStatus === 'PROLONG' ? 'PROLONG' : 'ACTIVE'}
                    </button>
                </td>
                <td style={{ padding: '10px 16px' }}>
                    {item.replacementHistory && item.replacementHistory.length > 0 ? (
                        <button onClick={() => setShowHistoryModal(true)} style={{
                            background: C.blueLight, border: `1px solid ${C.blue}`, color: C.blue,
                            padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', textDecoration: 'none'
                        }}>
                            Riwayat <span style={{ background: C.blue, color: '#fff', padding: '2px 6px', borderRadius: 10, fontSize: 10 }}>{item.replacementHistory.length}</span>
                        </button>
                    ) : (
                        <span style={{
                            background: C.surface, border: `1px solid ${C.border}`, color: C.muted,
                            padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                            display: 'inline-block'
                        }}>Tidak ada</span>
                    )}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowDoneModal(true)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: C.green, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Done</button>
                        <button onClick={() => setShowEditModal(true)} style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit Data"><Edit size={14} /></button>
                    </div>
                </td>
            </tr>

            {showHistoryModal && item.replacementHistory && (
                <Overlay onClose={() => setShowHistoryModal(false)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Riwayat Penggantian</h3>
                        <span style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{ac.registration} - {item.carpetType}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {item.replacementHistory.map(h => (
                            <div key={h.id} style={{
                                background: h.isPremature ? C.warningLight : C.surface,
                                border: `1px solid ${h.isPremature ? C.warningBorder : C.border}`,
                                borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: h.isPremature ? C.warning : C.muted }}>
                                        Done {h.doneNumber}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: h.isPremature ? C.warning : C.text, marginTop: 2 }}>
                                        {fmtDate(h.doneDate)}
                                    </div>
                                </div>
                                {h.isPremature && <span style={{ fontSize: 16 }}>⚡</span>}
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setShowHistoryModal(false)} style={{
                        width: '100%', marginTop: 20, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`,
                        background: C.surface, fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer',
                    }}>Tutup</button>
                </Overlay>
            )}

            {showDoneModal && <AddDoneModal carpetItem={item} registration={ac.registration} onClose={() => setShowDoneModal(false)} onSaved={onRefresh} />}
            {showEditModal && <EditDetailsModal carpetItem={item} registration={ac.registration} onClose={() => setShowEditModal(false)} onSaved={onRefresh} />}
        </>
    )
}
