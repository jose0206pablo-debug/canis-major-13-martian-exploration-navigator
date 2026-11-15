import type { DataCategory, EvidenceState } from '../data/types'
const labels: Record<EvidenceState, string> = { IDENTIFIED: 'Identificado', METADATA_VERIFIED: 'Metadatos verificados', DOWNLOADED: 'Descargado', PROCESSED: 'Procesado', SPATIALLY_VALIDATED: 'Validado espacialmente', INTEGRATED: 'Integrado', TESTED: 'Probado', DERIVED: 'Calculado', PRACTICE: 'Dato de práctica', UNVALIDATED: 'No validado' }
const categories: Record<DataCategory, string> = { measured: 'Dato medido', derived: 'Derivado', contextual: 'Contextual' }
export function evidenceLabel(state: EvidenceState) { return labels[state] }
export function categoryLabel(category: DataCategory) { return categories[category] }
export function evidenceClass(state: EvidenceState) {
  if (state === 'PRACTICE') return 'practice'
  if (state === 'METADATA_VERIFIED') return 'verified'
  if (state === 'INTEGRATED' || state === 'TESTED' || state === 'SPATIALLY_VALIDATED') return 'integrated'
  if (state === 'PROCESSED' || state === 'DERIVED') return 'processed'
  return 'unavailable'
}
