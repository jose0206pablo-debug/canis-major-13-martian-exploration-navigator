import { describe, expect, it } from 'vitest'
import { evidenceClass, evidenceLabel } from '../src/utils/evidence'
describe('estados de evidencia', () => { it('etiqueta los datos de práctica de forma visible', () => { expect(evidenceLabel('PRACTICE')).toBe('Dato de práctica'); expect(evidenceClass('PRACTICE')).toBe('practice') }); it('distingue metadatos verificados de datos integrados', () => { expect(evidenceLabel('METADATA_VERIFIED')).toBe('Metadatos verificados'); expect(evidenceLabel('INTEGRATED')).toBe('Integrado') }) })
