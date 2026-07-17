/**
 * Hidden SVG displacement filter for liquid-glass surfaces.
 * Referenced via backdrop-filter: url(#liquid-glass-dock).
 * Progressive enhancement — Safari/WebKit typically uses blur+shadows only.
 */
export function LiquidGlassFilter() {
  return (
    <div className="liquid-glass-filter" aria-hidden="true">
      <svg>
        <filter id="liquid-glass-dock" primitiveUnits="objectBoundingBox">
          <feImage
            result="map"
            width="100%"
            height="100%"
            x="0"
            y="0"
            href="/liquid-glass-map.webp"
            preserveAspectRatio="none"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.04" result="blur" />
          <feDisplacementMap
            in="blur"
            in2="map"
            scale="0.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>
  )
}
