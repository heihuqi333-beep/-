


import React, { useEffect, useRef, useState, useMemo, MouseEvent } from 'react';
import { ProteinStructure, Language } from '../types';
import { t } from '../utils/translations';
import { Layers, Circle, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  protein: ProteinStructure | null;
  language: Language;
}

// Helper: Catmull-Rom Spline interpolation
const spline = (p0: any, p1: any, p2: any, p3: any, t: number) => {
    const v0 = (p2.x - p0.x) * 0.5;
    const v1 = (p3.x - p1.x) * 0.5;
    const t2 = t * t;
    const t3 = t * t2;
    const x = (2 * p1.x - 2 * p2.x + v0 + v1) * t3 + (-3 * p1.x + 3 * p2.x - 2 * v0 - v1) * t2 + v0 * t + p1.x;

    const v0y = (p2.y - p0.y) * 0.5;
    const v1y = (p3.y - p1.y) * 0.5;
    const y = (2 * p1.y - 2 * p2.y + v0y + v1y) * t3 + (-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 + v0y * t + p1.y;

    const v0z = (p2.z - p0.z) * 0.5;
    const v1z = (p3.z - p1.z) * 0.5;
    const z = (2 * p1.z - 2 * p2.z + v0z + v1z) * t3 + (-3 * p1.z + 3 * p2.z - 2 * v0z - v1z) * t2 + v0z * t + p1.z;

    return { x, y, z };
};

const Protein3DViewer: React.FC<Props> = ({ protein, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef({ x: 0.5, y: 0.5 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [renderStyle, setRenderStyle] = useState<'ribbon' | 'ball-stick'>('ribbon');
  const [zoom, setZoom] = useState(1.0);

  // Advanced Procedural Structure Generator
  const modelData = useMemo(() => {
    if (!protein) return { points: [], atoms: [], maxRadius: 0 };

    const seedStr = protein.pdbId;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
    
    // Deterministic RNG
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const numResidues = 150 + Math.floor(random() * 50); // Length of chain
    const backbonePoints = [];
    
    // 1. Generate Backbone Control Points (C-alpha trace)
    let currentMode = 'helix'; 
    let modeStep = 0;
    
    let x = 0, y = 0, z = 0;
    let maxR = 0;

    for (let i = 0; i < numResidues; i++) {
        // Switch modes occasionally
        modeStep++;
        if ((currentMode === 'helix' && modeStep > 20 && random() > 0.8) || 
            (currentMode === 'sheet' && modeStep > 10 && random() > 0.8) ||
            (currentMode === 'loop' && modeStep > 5 && random() > 0.7)) {
            
            const types = ['helix', 'sheet', 'loop'];
            currentMode = types[Math.floor(random() * types.length)];
            modeStep = 0;
        }

        // Move cursor based on secondary structure geometry
        if (currentMode === 'helix') {
            const rad = 6;
            const rise = 1.5;
            const angle = i * 0.5;
            x += Math.cos(angle) * rad * 0.2; // Spiral drift
            y += rise;
            z += Math.sin(angle) * rad * 0.2;
            
            backbonePoints.push({
                x: x + Math.cos(angle) * 5,
                y: y,
                z: z + Math.sin(angle) * 5,
                type: 'helix',
                pLDDT: 90 + random() * 10
            });
        } else if (currentMode === 'sheet') {
            const width = 4;
            const rise = 3.5;
            x += (i % 2 === 0 ? 1 : -1) * width;
            y += rise;
            z += (random() - 0.5) * 2;
            
            backbonePoints.push({
                x, y, z,
                type: 'sheet',
                pLDDT: 70 + random() * 20
            });
        } else {
            // Loop / Coil
            x += (random() - 0.5) * 8;
            y += (random() - 0.2) * 5;
            z += (random() - 0.5) * 8;
            
            backbonePoints.push({
                x, y, z,
                type: 'loop',
                pLDDT: 40 + random() * 40
            });
        }
        
        const d = Math.sqrt(x*x + y*y + z*z);
        if (d > maxR) maxR = d;
    }

    // Center the molecule
    const cx = backbonePoints.reduce((acc, p) => acc + p.x, 0) / numResidues;
    const cy = backbonePoints.reduce((acc, p) => acc + p.y, 0) / numResidues;
    const cz = backbonePoints.reduce((acc, p) => acc + p.z, 0) / numResidues;
    backbonePoints.forEach(p => { p.x -= cx; p.y -= cy; p.z -= cz; });

    // 2. Generate Spline Points (Ribbon)
    const splinePoints = [];
    const stepsPerSegment = 6;

    for (let i = 0; i < backbonePoints.length - 3; i++) {
        const p0 = backbonePoints[i];
        const p1 = backbonePoints[i+1];
        const p2 = backbonePoints[i+2];
        const p3 = backbonePoints[i+3];

        for (let t = 0; t < 1; t += 1/stepsPerSegment) {
            const pos = spline(p0, p1, p2, p3, t);
            const type = p1.type;
            const pLDDT = p1.pLDDT * (1-t) + p2.pLDDT * t;
            
            let color = '#FF7D45'; // Orange
            if (pLDDT > 90) color = '#0053D6'; // Dark Blue
            else if (pLDDT > 70) color = '#65CBF3'; // Light Blue
            else if (pLDDT > 50) color = '#FFDB13'; // Yellow

            let radius = 1.5;
            if (type === 'helix') radius = 3.5;
            if (type === 'sheet') radius = 3.0;

            splinePoints.push({ ...pos, color, radius, type });
        }
    }

    // 3. Generate Atoms for Ball & Stick mode
    // Classic Scientific Colors (CPK)
    const atoms = backbonePoints.map((p, i) => {
        const atomType = i % 4; // Mock atom types in backbone
        let color = '#9ca3af'; // Carbon (Gray)
        let element = 'C';
        
        if (atomType === 1) { color = '#ef4444'; element = 'O'; } // Oxygen (Red)
        else if (atomType === 2) { color = '#3b82f6'; element = 'N'; } // Nitrogen (Blue)
        else if (atomType === 3 && random() > 0.8) { color = '#eab308'; element = 'S'; } // Sulfur (Yellow)

        // Make radius larger for visibility
        return { ...p, color, radius: 4.0, id: i, element };
    });

    return { points: splinePoints, atoms, maxRadius: maxR };
  }, [protein]);

  const handleMouseDown = (e: MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    
    rotationRef.current.x += deltaY * 0.01;
    rotationRef.current.y += deltaX * 0.01;
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.4));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !protein) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    
    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    const { points, atoms, maxRadius } = modelData;

    const render = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f8fafc'; 
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      
      // Increased Base Scale for Larger Visualization
      // Was 0.6, increased to 0.85 as base, multiplied by zoom state
      const minDim = Math.min(w, h);
      const baseScale = (minDim * 0.85 * zoom) / (maxRadius || 10);
      
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.003;
      }

      const rot = rotationRef.current;
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);

      const project = (p: {x:number, y:number, z:number}) => {
        let x = p.x * cosY - p.z * sinY;
        let z = p.z * cosY + p.x * sinY;
        let y = p.y * cosX - z * sinX;
        z = z * cosX + p.y * sinX;

        const cameraZ = 600; 
        const perspective = cameraZ / (cameraZ + z); 
        
        return {
            x: cx + x * baseScale * perspective,
            y: cy + y * baseScale * perspective,
            scale: baseScale * perspective,
            zDepth: z
        };
      };

      if (renderStyle === 'ribbon') {
        // Render Smooth Ribbon (AlphaFold Style)
        const projectedPath = points.map(p => ({ ...p, proj: project(p) }));
        
        const segments = [];
        for (let i = 0; i < projectedPath.length - 1; i++) {
            const p1 = projectedPath[i];
            const p2 = projectedPath[i+1];
            segments.push({
                p1, p2,
                z: (p1.proj.zDepth + p2.proj.zDepth) / 2
            });
        }
        segments.sort((a, b) => b.z - a.z);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        segments.forEach(seg => {
            const { p1, p2 } = seg;
            const width = p1.radius * p1.proj.scale;
            
            ctx.beginPath();
            ctx.moveTo(p1.proj.x, p1.proj.y);
            ctx.lineTo(p2.proj.x, p2.proj.y);
            
            ctx.strokeStyle = p1.color;
            ctx.lineWidth = width;
            ctx.stroke();

            // Specular Highlight
            ctx.beginPath();
            ctx.moveTo(p1.proj.x - width*0.1, p1.proj.y - width*0.1);
            ctx.lineTo(p2.proj.x - width*0.1, p2.proj.y - width*0.1);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = width * 0.4;
            ctx.stroke();
        });

      } else {
        // Classic Ball & Stick Render
        const projectedAtoms = atoms.map(a => ({ ...a, proj: project(a) }));
        projectedAtoms.sort((a, b) => b.proj.zDepth - a.proj.zDepth);

        // 1. Draw Bonds first (Connect adjacent atoms in backbone)
        ctx.beginPath();
        for (let i = 0; i < projectedAtoms.length - 1; i++) {
             const a1 = projectedAtoms[i];
             const a2 = projectedAtoms.find(a => a.id === a1.id + 1);
             if (a2) {
                 ctx.moveTo(a1.proj.x, a1.proj.y);
                 ctx.lineTo(a2.proj.x, a2.proj.y);
             }
        }
        ctx.strokeStyle = '#64748b'; // Bond color
        ctx.lineWidth = 4 * (baseScale * 0.05); // Dynamic bond width
        ctx.stroke();

        // 2. Draw Atoms
        projectedAtoms.forEach(atom => {
            const { x, y, scale } = atom.proj;
            const r = atom.radius * scale;

            ctx.beginPath();
            ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
            
            // Simple 3D Gradient for clean look
            const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
            grad.addColorStop(0, '#ffffff'); // Glint
            grad.addColorStop(0.3, atom.color);
            grad.addColorStop(1, '#1f2937'); // Shadow
            
            ctx.fillStyle = grad;
            ctx.fill();
            
            // Optional: Outline for cartoon look clarity
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
      }

      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resizeCanvas);
    };
  }, [protein, renderStyle, modelData, zoom]);

  if (!protein) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
        <Maximize2 size={32} className="mb-2 opacity-50" />
        <p>{t('drug.select_prompt', language)}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-inner group cursor-grab active:cursor-grabbing">
        {/* Header Info */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
            <h3 className="text-xl font-bold text-slate-800">{protein.pdbId}</h3>
            <p className="text-slate-600 text-sm font-medium bg-white/60 px-2 py-0.5 rounded backdrop-blur-sm">
                {language === 'zh' ? protein.nameZh : protein.name}
            </p>
        </div>
        
        {/* Controls Container */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
            {/* Style Controls */}
            <div className="bg-white shadow-sm p-1 rounded-md border border-slate-200 flex gap-1">
                <button 
                    onClick={() => setRenderStyle('ribbon')}
                    className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${renderStyle === 'ribbon' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    title={t('drug.style_ribbon', language)}
                >
                    <Layers size={14} />
                    <span className="hidden sm:inline">{t('drug.style_ribbon', language)}</span>
                </button>
                <button 
                    onClick={() => setRenderStyle('ball-stick')}
                    className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${renderStyle === 'ball-stick' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    title={t('drug.style_ball', language)}
                >
                    <Circle size={14} fill="currentColor" />
                    <span className="hidden sm:inline">{t('drug.style_ball', language)}</span>
                </button>
            </div>

            {/* Zoom Controls */}
            <div className="bg-white shadow-sm p-1 rounded-md border border-slate-200 flex flex-col gap-1 self-end">
                <button 
                    onClick={handleZoomIn}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center"
                    title={t('drug.zoom_in', language)}
                >
                    <ZoomIn size={16} />
                </button>
                <button 
                    onClick={handleZoomOut}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center"
                    title={t('drug.zoom_out', language)}
                >
                    <ZoomOut size={16} />
                </button>
            </div>
        </div>

        {/* AlphaFold Legend */}
        {renderStyle === 'ribbon' && (
            <div className="absolute top-16 left-4 z-10 bg-white/95 p-2 rounded-md border border-slate-100 shadow-md text-[10px] select-none pointer-events-none">
                <div className="font-bold text-slate-700 mb-1.5 border-b border-slate-100 pb-1">Model Confidence (pLDDT)</div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-sm bg-[#0053D6] shadow-sm"></span> <span>Very High (&gt;90)</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-sm bg-[#65CBF3] shadow-sm"></span> <span>Confident (70-90)</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-sm bg-[#FFDB13] shadow-sm"></span> <span>Low (50-70)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#FF7D45] shadow-sm"></span> <span>Very Low (&lt;50)</span>
                </div>
            </div>
        )}

        <div className="absolute bottom-4 left-4 text-slate-500 text-xs z-10 pointer-events-none select-none bg-white/60 px-2 py-1 rounded">
             <p>{t('drug.viewer_instruction', language)}</p>
        </div>

        <div className="absolute bottom-4 right-4 text-slate-500 text-xs z-10 text-right pointer-events-none select-none bg-white/90 p-2 rounded border border-slate-100 shadow-sm">
            <p className="font-mono">Res: {protein.resolution}</p>
            <p className="font-mono">{protein.molecularWeight}</p>
            <p className="font-mono mt-0.5">Zoom: {Math.round(zoom * 100)}%</p>
            <p className="mt-1 text-emerald-600 font-bold flex items-center justify-end gap-1 uppercase tracking-wider text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('drug.viewer_live', language)}
            </p>
        </div>
        
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    </div>
  );
};

export default Protein3DViewer;