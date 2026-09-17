/**
 * Shared SVG filter defs for Authkit-like frosted midnight glass (cathedral clarity).
 * Specular lighting on glass chrome; frost/refraction at VERY low amp (decorative only).
 * Applied via CSS `filter: url(#…)` — keep displacement off text-bearing layers.
 */
export function GlassFilters() {
  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      className="pointer-events-none absolute"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Clear specular rim — cool ice highlight, no displacement (safe on panels) */}
        <filter
          id="glass-specular"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="blur" />
          <feSpecularLighting
            in="blur"
            surfaceScale={2.4}
            specularConstant={0.72}
            specularExponent={26}
            lightingColor="#d8ecf8"
            result="spec"
          >
            <fePointLight x="-90" y="-130" z={170} />
          </feSpecularLighting>
          <feComposite
            in="spec"
            in2="SourceAlpha"
            operator="in"
            result="specMasked"
          />
          <feComposite
            in="SourceGraphic"
            in2="specMasked"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={0.42}
            k4={0}
          />
        </filter>

        {/* Hero specular — slightly stronger ice sheen */}
        <filter
          id="glass-hero"
          x="-18%"
          y="-18%"
          width="136%"
          height="136%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.35" result="edgeBlur" />
          <feSpecularLighting
            in="edgeBlur"
            surfaceScale={3.0}
            specularConstant={0.88}
            specularExponent={20}
            lightingColor="#e8f4ff"
            result="spec"
          >
            <fePointLight x="-110" y="-150" z={190} />
          </feSpecularLighting>
          <feComposite
            in="spec"
            in2="SourceAlpha"
            operator="in"
            result="specMasked"
          />
          <feComposite
            in="SourceGraphic"
            in2="specMasked"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={0.52}
            k4={0}
          />
        </filter>

        {/* Ultra-low-amp frost for empty chrome overlays only (not on text) */}
        <filter
          id="glass-frost"
          x="-6%"
          y="-6%"
          width="112%"
          height="112%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9 1.1"
            numOctaves={1}
            seed={5}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.55
                    0 0 0 0 0.62
                    0 0 0 0 0.72
                    0 0 0 0.02 0"
            result="softNoise"
          />
          <feGaussianBlur in="softNoise" stdDeviation="0.8" result="frostGrain" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="frostGrain"
            scale={0.55}
            xChannelSelector="R"
            yChannelSelector="G"
            result="refract"
          />
          <feBlend in="refract" in2="SourceGraphic" mode="normal" />
        </filter>

        {/* Combined premium (specular + whisper frost) — for chrome overlays */}
        <filter
          id="glass-premium"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85 1.0"
            numOctaves={1}
            seed={2}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.55
                    0 0 0 0 0.62
                    0 0 0 0 0.72
                    0 0 0 0.015 0"
            result="softNoise"
          />
          <feGaussianBlur in="softNoise" stdDeviation="0.7" result="frostGrain" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="frostGrain"
            scale={0.4}
            xChannelSelector="R"
            yChannelSelector="G"
            result="refract"
          />
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.0" result="edgeBlur" />
          <feSpecularLighting
            in="edgeBlur"
            surfaceScale={2.2}
            specularConstant={0.65}
            specularExponent={28}
            lightingColor="#d8ecf8"
            result="spec"
          >
            <fePointLight x="-70" y="-110" z={150} />
          </feSpecularLighting>
          <feComposite
            in="spec"
            in2="SourceAlpha"
            operator="in"
            result="specMasked"
          />
          <feComposite
            in="refract"
            in2="specMasked"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={0.38}
            k4={0}
          />
        </filter>
      </defs>
    </svg>
  );
}
