import React from 'react';

interface PartBlueprintSvgProps {
  type: 'automotive-bumper' | 'window-profile' | 'fridge-gasket' | 'industrial-hose';
  className?: string;
}

export const PartBlueprintSvg: React.FC<PartBlueprintSvgProps> = ({ type, className = 'w-full h-28' }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/80 flex items-center justify-center p-2 ${className}`}>
      {/* Subtle CAD grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${type}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#cbd5e1" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${type})`} />
      </svg>

      {type === 'automotive-bumper' && (
        <svg viewBox="0 0 240 100" className="relative z-10 w-full h-full max-h-24">
          {/* CAD cross section & profile of automotive co-extruded seal */}
          <path
            d="M25,72 C35,34 75,24 125,24 C175,24 205,36 215,72 L195,78 C186,48 164,40 125,40 C86,40 54,48 45,78 Z"
            fill="#4EB99F"
            fillOpacity="0.18"
            stroke="#00A887"
            strokeWidth="2.2"
          />
          <path
            d="M45,78 L195,78"
            stroke="#E20074"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <circle cx="125" cy="32" r="5" fill="#E20074" fillOpacity="0.2" stroke="#E20074" strokeWidth="1.8" />
          <text x="12" y="16" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="600">
            CAD: RAU-EPDM/PP CO-EXT
          </text>
          <text x="155" y="92" fill="#E20074" fontSize="8" fontFamily="monospace" fontWeight="600">
            TOL: ±0.15mm
          </text>
        </svg>
      )}

      {type === 'fridge-gasket' && (
        <svg viewBox="0 0 240 100" className="relative z-10 w-full h-full max-h-24">
          {/* Multi-chamber magnetic gasket cross-section */}
          <rect x="42" y="20" width="156" height="60" rx="8" fill="#4EB99F" fillOpacity="0.14" stroke="#00A887" strokeWidth="2" />
          <rect x="54" y="30" width="60" height="40" rx="4" fill="white" stroke="#3B3D3F" strokeWidth="1.5" />
          <rect x="124" y="30" width="62" height="18" rx="3" fill="#E20074" fillOpacity="0.18" stroke="#E20074" strokeWidth="1.6" />
          <rect x="124" y="54" width="62" height="16" rx="3" fill="white" stroke="#3B3D3F" strokeWidth="1.5" />
          <text x="130" y="42" fill="#E20074" fontSize="7.5" fontFamily="monospace" fontWeight="700">
            MAGNET STRIP
          </text>
          <text x="12" y="15" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="600">
            CAD: RAU-PVC 1408 GASKET
          </text>
        </svg>
      )}

      {type === 'window-profile' && (
        <svg viewBox="0 0 240 100" className="relative z-10 w-full h-full max-h-24">
          {/* Multi-chamber window profile */}
          <path
            d="M55,15 L185,15 L185,85 L55,85 Z"
            fill="#4EB99F"
            fillOpacity="0.15"
            stroke="#00A887"
            strokeWidth="2.2"
          />
          <line x1="95" y1="15" x2="95" y2="85" stroke="#00A887" strokeWidth="1.6" />
          <line x1="145" y1="15" x2="145" y2="85" stroke="#00A887" strokeWidth="1.6" />
          <rect x="103" y="27" width="34" height="46" fill="#E20074" fillOpacity="0.14" stroke="#E20074" strokeWidth="1.8" />
          <text x="106" y="53" fill="#E20074" fontSize="7" fontFamily="monospace" fontWeight="700">
            FIPRO
          </text>
          <text x="12" y="15" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="600">
            CAD: RAU-FIPRO 6-CHAMBER
          </text>
        </svg>
      )}

      {type === 'industrial-hose' && (
        <svg viewBox="0 0 240 100" className="relative z-10 w-full h-full max-h-24">
          <circle cx="120" cy="50" r="34" fill="#4EB99F" fillOpacity="0.16" stroke="#00A887" strokeWidth="2.2" />
          <circle cx="120" cy="50" r="24" fill="none" stroke="#E20074" strokeWidth="1.6" strokeDasharray="4 2" />
          <circle cx="120" cy="50" r="16" fill="white" stroke="#3B3D3F" strokeWidth="1.8" />
          <text x="12" y="16" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="600">
            CAD: RAU-PE-Xa REINFORCED
          </text>
        </svg>
      )}
    </div>
  );
};

