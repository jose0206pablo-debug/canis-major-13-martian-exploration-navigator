import type { Layer } from '../data/types'
import { catalog } from '../data/layers'
export function Attribution({ activeLayers }: { activeLayers: Layer[] }) { const attributions = [...new Set(activeLayers.map((layer) => catalog.sources.find((source) => source.id === layer.sourceId)?.attribution).filter(Boolean))]; return <footer className="attribution-bar"><strong>CANIS MAJOR 13</strong><span>Proyecto educativo · NASA Space Apps Challenge 2026.</span>{attributions.map((text) => <span key={text}>{text}</span>)}</footer> }
