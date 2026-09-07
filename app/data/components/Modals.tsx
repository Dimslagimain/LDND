'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Edit } from 'lucide-react'
import { C, AC_TYPES, getGroup, fmtDate } from '../constants'
import { MODAL_WIDTH_PX, OVERLAY_Z_INDEX, PREMATURE_GRACE_DAYS } from '@/lib/constants'
import { AIRLINES } from '@/lib/constants'
import { AircraftData, CarpetItemData } from '../types'

/* ───────────── Shared UI Helpers ───────────── */
export const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none',
}

export function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: OVERLAY_Z_INDEX, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />
            <div style={{
                position: 'relative', background: C.surface, borderRadius: 16, padding: 28, width: MODAL_WIDTH_PX,
                border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    )
}

export function ModalActions({ onClose, saving, label, color }: { onClose: () => void; saving: boolean; label: string; color?: string }) {
    return (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
                padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`,
                background: C.surface, fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer',
            }}>Batal</button>
            <button type="submit" disabled={saving} style={{
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: color ?? C.blue, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}>{saving ? 'Menyimpan...' : label}</button>
        </div>
    )
}

/* ───────────── Modals ───────────── */
export function AddAircraftModal({ airline, onClose, onSaved }: {
    airline: string; onClose: () => void; onSaved: () => void
}) {
    const [acType, setAcType] = useState(AC_TYPES[airline]?.[0] ?? '')
    const [reg, setReg] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!reg.trim()) { setError('Registrasi harus diisi'); return }
        setSaving(true); setError('')
        try {
            const res = await fetch('/api/aircraft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acType, acTypeGroup: getGroup(acType), registration: reg.trim(), airline }),
            })
            if (res.status === 409) { setError('Registrasi sudah ada'); setSaving(false); return }
            if (!res.ok) throw new Error()
            onSaved(); onClose()
        } catch { setError('Gagal menyimpan'); setSaving(false) }
    }

    return (
        <Overlay onClose={onClose}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                ✈️ Tambah Pesawat {airline === 'GA' ? AIRLINES.GA.name : AIRLINES.QG.name}
            </h3>
            <form onSubmit={handleSubmit}>
                <Field label="Tipe Pesawat">
                    <select value={acType} onChange={e => setAcType(e.target.value)} style={inputStyle}>
                        {(AC_TYPES[airline] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </Field>
                <Field label="Registrasi">
                    <input value={reg} onChange={e => setReg(e.target.value.toUpperCase())} placeholder="Contoh: PK-GDC"
                        style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700 }} />
                </Field>
                {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <ModalActions onClose={onClose} saving={saving} label="Simpan" />
            </form>
        </Overlay>
    )
}

export function AddDoneModal({ carpetItem, registration, onClose, onSaved }: {
    carpetItem: CarpetItemData; registration: string; onClose: () => void; onSaved: () => void
}) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const doneCount = carpetItem.replacementHistory.length

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!date) { setError('Tanggal harus diisi'); return }
        setSaving(true); setError('')
        try {
            const res = await fetch(`/api/carpet-items/${carpetItem.id}/done`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doneDate: date }),
            })
            if (!res.ok) throw new Error()
            onSaved(); onClose()
        } catch { setError('Gagal menyimpan'); setSaving(false) }
    }

    let isPremature = false
    if (carpetItem.nextDue) {
        const threshold = new Date(carpetItem.nextDue)
        threshold.setDate(threshold.getDate() - PREMATURE_GRACE_DAYS)
        if (new Date(date) < threshold) {
            isPremature = true
        }
    }

    return (
        <Overlay onClose={onClose}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={20} color={C.blue} />
                Catat Penggantian
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                <strong>{registration}</strong> — {carpetItem.carpetType} Carpet → Done-{doneCount + 1}
            </p>
            <form onSubmit={handleSubmit}>
                <Field label="Tanggal Penggantian">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </Field>
                {isPremature && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: C.warningLight, border: `1px solid ${C.warningBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.warning }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            Sebelum Next Due ({fmtDate(carpetItem.nextDue)}) — ditandai <strong>prematur</strong>
                        </div>
                    </div>
                )}
                {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <ModalActions onClose={onClose} saving={saving} label="Catat Done" color={C.green} />
            </form>
        </Overlay>
    )
}

export function EditDetailsModal({ carpetItem, registration, onClose, onSaved }: {
    carpetItem: CarpetItemData; registration: string; onClose: () => void; onSaved: () => void
}) {
    const [remark, setRemark] = useState(carpetItem.remark ?? '')
    const [acStatus, setAcStatus] = useState(carpetItem.acStatus ?? 'ACTIVE')
    const [coatroom, setCoatroom] = useState(carpetItem.coatroom ?? '')
    const [vendor, setVendor] = useState(carpetItem.vendor ?? '')
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await fetch(`/api/carpet-items/${carpetItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    remark: remark || null,
                    acStatus: acStatus || 'ACTIVE',
                    coatroom: coatroom || null,
                    vendor: vendor || null
                }),
            })
            onSaved(); onClose()
        } catch { setSaving(false) }
    }

    return (
        <Overlay onClose={onClose}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                ✏️ Edit Detail
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                <strong>{registration}</strong> — {carpetItem.carpetType} Carpet
            </p>
            <form onSubmit={handleSubmit}>
                <Field label="Remark">
                    <input value={remark} onChange={e => setRemark(e.target.value)} style={inputStyle} placeholder="Kosong" />
                </Field>
                <Field label="Status Pesawat">
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            onClick={() => setAcStatus('ACTIVE')}
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease',
                                background: acStatus === 'ACTIVE' ? C.greenLight : C.surface,
                                color: acStatus === 'ACTIVE' ? C.green : C.muted,
                                border: `1px solid ${acStatus === 'ACTIVE' ? C.greenBorder : C.border}`
                            }}
                        >
                            ● ACTIVE
                        </button>
                        <button
                            type="button"
                            onClick={() => setAcStatus('PROLONG')}
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease',
                                background: acStatus === 'PROLONG' ? C.warningLight : C.surface,
                                color: acStatus === 'PROLONG' ? C.warningDark : C.muted,
                                border: `1px solid ${acStatus === 'PROLONG' ? C.warningBorder : C.border}`
                            }}
                        >
                            ● PROLONG
                        </button>
                    </div>
                </Field>
                <Field label="Coatroom">
                    <input value={coatroom} onChange={e => setCoatroom(e.target.value)} style={inputStyle} placeholder="Kosong" />
                </Field>
                <Field label="Vendor">
                    <input value={vendor} onChange={e => setVendor(e.target.value)} style={inputStyle} placeholder="Contoh: Sanhua / Anker" />
                </Field>
                <ModalActions onClose={onClose} saving={saving} label="Simpan" />
            </form>
        </Overlay>
    )
}
