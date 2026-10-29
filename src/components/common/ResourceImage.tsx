import React, { useState } from 'react';
import {
  Printer,
  Flame,
  Activity,
  Cpu,
  Maximize2,
  Layers,
  Wrench,
  Camera,
  Laptop,
  Radio,
  Box,
} from 'lucide-react';

interface ResourceImageProps {
  src?: string;
  alt?: string;
  category?: string;
  type?: string;
  className?: string;
  containerClassName?: string;
}

export const getCategoryIcon = (category: string = '', type: string = '') => {
  const cat = (category || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (cat.includes('3d') || cat.includes('print')) return Printer;
  if (cat.includes('laser') || cat.includes('cut') || cat.includes('engrav')) return Flame;
  if (cat.includes('oscillo') || cat.includes('signal') || cat.includes('multimeter') || cat.includes('electronic'))
    return Activity;
  if (cat.includes('vr') || cat.includes('ar') || cat.includes('headset') || cat.includes('gpu') || cat.includes('compute'))
    return Cpu;
  if (t === 'space' || cat.includes('studio') || cat.includes('room') || cat.includes('space') || cat.includes('bay'))
    return Maximize2;
  if (cat.includes('sensor') || cat.includes('iot') || cat.includes('device')) return Radio;
  if (cat.includes('camera') || cat.includes('capture') || cat.includes('photo')) return Camera;
  if (cat.includes('workstation') || cat.includes('laptop') || cat.includes('pc')) return Laptop;
  if (t === 'tool' || cat.includes('drill') || cat.includes('cnc') || cat.includes('mill')) return Wrench;

  return Layers;
};

export const ResourceImage: React.FC<ResourceImageProps> = ({
  src,
  alt = '',
  category = '',
  type = '',
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 overflow-hidden',
}) => {
  const [hasError, setHasError] = useState(false);
  const IconComponent = getCategoryIcon(category, type);

  return (
    <div className={containerClassName}>
      {/* Background Ambient Glow & Visual Fallback */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-28 h-28 bg-teal-500/10 rounded-full blur-lg pointer-events-none" />

      {/* Stylized Tech Centerpiece when no photo or photo fails */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none z-0">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center text-emerald-300 shadow-md shadow-emerald-950/60">
          <IconComponent className="w-5 h-5 text-emerald-400" />
        </div>
        {category && (
          <span className="text-[10px] font-medium tracking-wide text-emerald-200/50 mt-1.5 max-w-[85%] truncate">
            {category}
          </span>
        )}
      </div>

      {/* Render Image safely if provided and not errored */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setHasError(true)}
          className={`relative z-1 ${className}`}
        />
      )}
    </div>
  );
};
