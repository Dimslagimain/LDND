export interface ReplacementHistory {
    id: string; doneNumber: number; doneDate: string; isPremature: boolean
}
export interface CarpetItemData {
    id: string; carpetType: string; intervalMonths: number
    lastDone: string | null; nextDue: string | null; remark: string | null
    acStatus: string | null; vendor: string | null; coatroom: string | null
    replacementHistory: ReplacementHistory[]
}
export interface AircraftData {
    id: string; acType: string; acTypeGroup: string
    registration: string; airline: string; carpetItems: CarpetItemData[]
}
