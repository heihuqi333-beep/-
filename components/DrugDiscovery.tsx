
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PROTEIN_STRUCTURES } from '../constants';
import { ProteinStructure, Language } from '../types';
import { t } from '../utils/translations';
import Protein3DViewer from './Protein3DViewer';
import { Database, Box, Play, FileOutput, Loader2, Beaker, Upload, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  language: Language;
}

// Pseudo-Random Number Generator for deterministic visuals based on seeds
class PseudoRandom {
    private seed: number;

    constructor(seedStr: string) {
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    // Returns number between 0 and 1
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    // Returns random integer between min and max
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }
    
    // Pick random item from array
    pick<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

// Internal Component for 3D Ligand Binding Pocket with Seeded Randomness
const LigandPocket3D: React.FC<{ drugName: string }> = ({ drugName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotationRef = useRef({ x: 0.5, y: 0.5 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    // Memoize structure data to prevent jitter on re-renders, dependent on drugName
    const structureData = useMemo(() => {
        const prng = new PseudoRandom(drugName);
        
        // Generate atoms for the ligand (Central cluster)
        const numAtoms = Math.floor(prng.range(12, 25));
        const ligandAtoms = Array.from({ length: numAtoms }).map((_, i) => {
            const angle = (i / numAtoms) * Math.PI * 2;
            const r = prng.range(8, 20);
            const z = prng.range(-15, 15);
            
            let color = '#10b981'; // Greenish
            const type = prng.next();
            if (type < 0.2) color = '#ef4444'; // Oxygen (Red)
            else if (type < 0.4) color = '#3b82f6'; // Nitrogen (Blue)
            else if (type < 0.5) color = '#f59e0b'; // Sulfur/Phosphorus (Yellow/Orange)

            return {
                x: Math.cos(angle) * r + prng.range(-5, 5),
                y: Math.sin(angle) * r + prng.range(-5, 5),
                z: z,
                color: color,
                radius: prng.range(4, 8)
            };
        });

        // Generate surrounding residues (Stick representation) unique to this "drug's pocket"
        const numResidues = Math.floor(prng.range(5, 9));
        const residues = Array.from({ length: numResidues }).map((_, i) => {
            const angle = (i / numResidues) * Math.PI * 2 + prng.next();
            const dist = prng.range(50, 70);
            const z = prng.range(-40, 40);
            const labelNum = Math.floor(prng.range(20, 400));
            const aa = prng.pick(['ASP', 'GLU', 'LYS', 'ARG', 'HIS', 'PHE', 'TYR', 'TRP', 'VAL', 'LEU']);
            
            return {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                z: z,
                label: `${aa}${labelNum}`,
                color: '#94a3b8'
            };
        });

        return { ligandAtoms, residues };
    }, [drugName]);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();

        let animationId: number;

        const render = () => {
            // Dimensions in CSS pixels
            const width = canvas.width / dpr;
            const height = canvas.height / dpr;
            
            ctx.clearRect(0, 0, width, height);
            
            // Background gradient
            const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, 350);
            bgGrad.addColorStop(0, '#f8fafc');
            bgGrad.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            if (!isDraggingRef.current) {
                rotationRef.current.y += 0.003;
            }

            const cx = width / 2;
            const cy = height / 2;
            const rot = rotationRef.current;
            const cosX = Math.cos(rot.x);
            const sinX = Math.sin(rot.x);
            const cosY = Math.cos(rot.y);
            const sinY = Math.sin(rot.y);

            const project = (x: number, y: number, z: number) => {
                let px = x * cosY - z * sinY;
                let pz = z * cosY + x * sinY;
                let py = y * cosX - pz * sinX;
                pz = pz * cosX + y * sinX;
                
                const scale = 500 / (500 + pz);
                return { x: cx + px * scale, y: cy + py * scale, scale, z: pz };
            };

            // 1. Draw Residue Sticks
            structureData.residues.forEach(res => {
                const p = project(res.x, res.y, res.z);
                const center = project(0, 0, 0);

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(center.x, center.y);
                ctx.strokeStyle = '#cbd5e1';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#64748b';
                ctx.font = '10px Inter';
                ctx.fillText(res.label, p.x, p.y);
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4 * p.scale, 0, Math.PI * 2);
                ctx.fillStyle = '#94a3b8';
                ctx.fill();
            });

            // 2. Draw Ligand Atoms
            const projectedAtoms = structureData.ligandAtoms.map(a => ({...a, proj: project(a.x, a.y, a.z)}));
            projectedAtoms.sort((a, b) => b.proj.z - a.proj.z);

            ctx.beginPath();
            projectedAtoms.forEach((atom, i) => {
                 for(let j = 1; j <= 2; j++) {
                     if (i + j < projectedAtoms.length) {
                        const neighbor = projectedAtoms[i+j];
                        if (Math.abs(atom.z - neighbor.z) < 20) {
                             ctx.moveTo(atom.proj.x, atom.proj.y);
                             ctx.lineTo(neighbor.proj.x, neighbor.proj.y);
                        }
                     }
                 }
            });
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();

            projectedAtoms.forEach(atom => {
                const { x, y, scale } = atom.proj;
                const r = atom.radius * scale;

                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, atom.color);
                grad.addColorStop(1, '#0f172a');
                ctx.fillStyle = grad;
                ctx.fill();
            });

            animationId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationId);
    }, [structureData]);

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};


const DrugDiscovery: React.FC<Props> = ({ language }) => {
  const [proteinList, setProteinList] = useState<ProteinStructure[]>(PROTEIN_STRUCTURES);
  const [selectedProtein, setSelectedProtein] = useState<ProteinStructure | null>(null);
  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [dockingResults, setDockingResults] = useState<any[]>([]);
  const [moiViewMode, setMoiViewMode] = useState<'2d' | '3d'>('2d');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-world drug data mapping
  const getDockingData = (pdbId: string) => {
      let data = [
        { name: 'Aspirin', score: -6.2, toxicity: 0.05, formula: 'C9H8O4' },
        { name: 'Ibuprofen', score: -6.5, toxicity: 0.1, formula: 'C13H18O2' },
        { name: 'Caffeine', score: -5.8, toxicity: 0.0, formula: 'C8H10N4O2' },
      ];

      if (pdbId === '3H8D' || pdbId.includes('CFTR')) {
          data = [
            { name: 'Ivacaftor (VX-770)', score: -9.8, toxicity: 0.12, formula: 'C24H28N2O3' },
            { name: 'Lumacaftor (VX-809)', score: -8.9, toxicity: 0.15, formula: 'C24H18F2N2O5' },
            { name: 'Tezacaftor (VX-661)', score: -8.4, toxicity: 0.08, formula: 'C26H27F3N2O6' },
            { name: 'Elexacaftor', score: -9.2, toxicity: 0.10, formula: 'C26H34F3N5O3S' },
            { name: 'Ataluren', score: -7.1, toxicity: 0.25, formula: 'C15H11FN2O3' },
          ];
      } else if (pdbId === '4HHB' || pdbId.includes('Hemoglobin')) {
          data = [
              { name: 'Voxelotor', score: -9.1, toxicity: 0.05, formula: 'C19H19N3O3' },
              { name: 'Hydroxyurea', score: -6.5, toxicity: 0.4, formula: 'CH4N2O2' },
              { name: 'L-Glutamine', score: -5.5, toxicity: 0.0, formula: 'C5H10N2O3' },
          ];
      } else if (pdbId === '6VXX') {
          data = [
              { name: 'Nirmatrelvir', score: -9.5, toxicity: 0.1, formula: 'C23H32F3N5O4' },
              { name: 'Remdesivir', score: -8.2, toxicity: 0.2, formula: 'C27H35N6O8P' },
              { name: 'Molnupiravir', score: -7.8, toxicity: 0.15, formula: 'C13H19N3O7' },
          ];
      } else if (pdbId === '1AKI' || pdbId === '1MBN') {
           data = [
              { name: 'Benzamidine', score: -7.4, toxicity: 0.2, formula: 'C7H8N2' },
              { name: 'Acetyltryptophan', score: -6.8, toxicity: 0.05, formula: 'C13H14N2O3' },
          ];
      }

      return data.sort((a,b) => a.score - b.score);
  };

  const handleSelectProtein = (protein: ProteinStructure) => {
    setSelectedProtein(protein);
    setSimStatus('idle');
    setDockingResults(getDockingData(protein.pdbId));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const newProtein: ProteinStructure = {
            id: `U${Date.now()}`,
            pdbId: file.name.split('.')[0].substring(0, 4).toUpperCase() || 'USER',
            name: file.name,
            nameZh: file.name,
            category: 'User Upload',
            categoryZh: '用户上传',
            molecularWeight: 'Unknown',
            resolution: 'Unknown',
            chainCount: 1,
            description: 'Custom protein structure uploaded by user.',
            descriptionZh: '用户上传的自定义蛋白质结构。'
        };
        setProteinList([newProtein, ...proteinList]);
        handleSelectProtein(newProtein);
    }
  };

  const handleShare = () => {
    alert(t('drug.shared_success', language));
  };

  const handleInitiateSimulation = () => {
    if (!selectedProtein) return;
    setSimStatus('running');
    setTimeout(() => {
        setSimStatus('completed');
    }, 2500); 
  };

  // Generate SVG String for Scientific 2D Interaction Diagram using PseudoRandom
  const generateMechanismSVG = (drugName: string) => {
      const prng = new PseudoRandom(drugName);
      const width = 800; 
      const height = 400;
      const cx = width / 2;
      const cy = height / 2;

      // Generate 4-7 Interactions based on seed
      const interactions = [];
      const numInteractions = Math.floor(prng.range(4, 8));
      const residues = ['Asp', 'Glu', 'Lys', 'Arg', 'His', 'Phe', 'Tyr', 'Trp', 'Val', 'Ser', 'Thr'];
      
      for(let i=0; i<numInteractions; i++) {
          const angle = (i / numInteractions) * Math.PI * 2 + prng.range(0, 0.5);
          const dist = prng.range(120, 150);
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist;
          const resName = prng.pick(residues);
          const resNum = Math.floor(prng.range(50, 400));
          const type = prng.next() > 0.5 ? 'hbond' : 'hydrophobic';
          
          interactions.push({ x, y, label: `${resName}${resNum}`, type, angle });
      }

      const interactionElements = interactions.map(item => {
          if (item.type === 'hbond') {
              return `
                <g transform="translate(${item.x}, ${item.y})">
                    <rect x="-20" y="-10" width="40" height="20" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
                    <text x="0" y="4" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#854d0e">${item.label}</text>
                    <line x1="0" y1="0" x2="${(cx - item.x) * 0.4}" y2="${(cy - item.y) * 0.4}" stroke="#16a34a" stroke-width="2" stroke-dasharray="4,3"/>
                    <text x="${(cx - item.x) * 0.2}" y="${(cy - item.y) * 0.2}" font-family="Arial" font-size="10" fill="#166534" font-style="italic">${prng.range(2.1, 3.2).toFixed(1)} Å</text>
                </g>
              `;
          } else {
              // Hydrophobic Eyelash
               return `
                <g transform="translate(${item.x}, ${item.y})">
                    <path d="M -15 10 Q 0 25 15 10" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" transform="rotate(${item.angle * 180 / Math.PI + 90})"/>
                    <text x="0" y="0" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#9a3412">${item.label}</text>
                     <text x="0" y="20" text-anchor="middle" font-family="Arial" font-size="9" fill="#f97316">Hydrophobic</text>
                </g>
              `;
          }
      }).join('');

      // Generate distinct drug shape based on name length or chars
      const drugShapeType = Math.floor(prng.range(0, 3));
      let drugPath = "M -25 -15 L 0 -30 L 25 -15 L 25 15 L 0 30 L -25 15 Z M -25 -15 L 0 0 L 25 -15 M 0 0 L 0 30"; // Hex
      if (drugShapeType === 1) drugPath = "M -30 0 L -15 -25 L 15 -25 L 30 0 L 15 25 L -15 25 Z M -15 -25 L 15 25 M 15 -25 L -15 25"; // Hex Rotated
      if (drugShapeType === 2) drugPath = "M -25 -10 L 25 -10 L 25 10 L -25 10 Z M 0 -10 L 0 10 M -12 -10 L -12 10 M 12 -10 L 12 10"; // Rectangle chain

      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: white; min-width: ${width}px;">
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8fafc" stroke-width="1"/>
                </pattern>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#cbd5e1" />
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <!-- Drug Molecule -->
            <g transform="translate(${cx}, ${cy}) scale(2.0)" filter="url(#shadow)">
                <path d="${drugPath}" fill="#ecfdf5" stroke="#047857" stroke-width="2"/>
                <circle cx="0" cy="0" r="4" fill="#10b981"/>
                <text x="0" y="45" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#065f46">${drugName}</text>
            </g>

            ${interactionElements}
        </svg>
      `;
  };

  const handleExport = () => {
    if (!selectedProtein) {
        alert(t('drug.select_prompt', language));
        return;
    }

    const reportDate = new Date().toLocaleDateString();
    const lead = dockingResults.length > 0 ? dockingResults[0] : null;
    const labels = {
        title: language === 'zh' ? '生物医药AI报告' : 'BioGenAI Report',
        subtitle: language === 'zh' ? 'AI辅助药物发现与设计' : 'AI-Assisted Drug Discovery & Design',
        date: language === 'zh' ? '日期' : 'Date',
        target: language === 'zh' ? '靶点蛋白' : 'Target Protein',
        lead: language === 'zh' ? '最佳候选药物' : 'Lead Candidate',
        score: language === 'zh' ? '亲和力评分' : 'Affinity Score',
        moi: language === 'zh' ? '药物-靶点作用机制' : 'Interaction Mechanism',
    };

    const moiSVG = lead ? generateMechanismSVG(lead.name) : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BioGenAI Report - ${selectedProtein.pdbId}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { font-family: sans-serif; }</style>
      </head>
      <body class="p-8 bg-white text-slate-900">
        <div class="max-w-4xl mx-auto border border-slate-200 p-8 rounded-lg shadow-sm">
          <header class="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-blue-900">${labels.title}</h1>
              <p class="text-sm text-slate-500">${labels.subtitle}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-slate-700">${labels.date}: ${reportDate}</p>
              <p class="text-sm text-slate-500">ID: ${selectedProtein.id}</p>
            </div>
          </header>

          <section class="mb-8 bg-slate-50 p-6 rounded-lg">
            <h2 class="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3 mb-4">${labels.target}</h2>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-semibold text-slate-600">PDB ID:</span> ${selectedProtein.pdbId}</div>
              <div><span class="font-semibold text-slate-600">Name:</span> ${language === 'zh' ? selectedProtein.nameZh : selectedProtein.name}</div>
            </div>
          </section>

          ${lead ? `
          <section class="mb-8">
            <h2 class="text-lg font-bold text-slate-800 border-l-4 border-emerald-500 pl-3 mb-4">${labels.lead}</h2>
            <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-lg mb-6">
               <div class="flex justify-between items-center">
                  <h3 class="text-xl font-bold text-emerald-900">${lead.name}</h3>
                  <div class="text-right">
                      <p class="text-sm font-semibold">${labels.score}</p>
                      <p class="text-2xl font-bold text-emerald-700">${lead.score}</p>
                  </div>
               </div>
            </div>
            
            <h3 class="text-md font-bold text-slate-700 mb-3">${labels.moi}</h3>
            <div class="flex justify-center p-4 border border-slate-200 rounded-lg bg-white">
                ${moiSVG.replace('width="800"', 'width="100%"').replace('height="400"', 'height="auto"')}
            </div>
          </section>
          ` : ''}

          <footer class="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            Generated by BioGenAI Platform
          </footer>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BioGenAI_Report_${selectedProtein.pdbId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const leadCandidate = dockingResults.length > 0 ? dockingResults[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('drug.title', language)}</h2>
          <p className="text-slate-500">{t('drug.subtitle', language)}</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleShare}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
                <Share2 size={16} />
                {t('drug.share', language)}
            </button>
            <button 
                onClick={handleExport}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 active:scale-95 transform duration-150"
            >
                <FileOutput size={16} />
                {t('drug.export', language)}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[850px]">
        {/* Left: Protein List (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2"><Database size={18} /> {t('drug.list_title', language)}</div>
                <button 
                    onClick={handleUploadClick} 
                    className="p-1.5 hover:bg-slate-100 rounded-md text-blue-600 transition-colors"
                    title={t('drug.upload', language)}
                >
                    <Upload size={16} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdb,.cif,.ent" 
                    onChange={handleFileChange}
                />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {proteinList.map(protein => (
                    <div 
                        key={protein.id}
                        onClick={() => handleSelectProtein(protein)}
                        className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
                            selectedProtein?.id === protein.id 
                            ? 'bg-blue-50 border-blue-500 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800">{protein.pdbId}</span>
                            <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 rounded">
                                {language === 'zh' ? protein.categoryZh : protein.category}
                            </span>
                        </div>
                        <div className="text-sm text-slate-600 truncate">{language === 'zh' ? protein.nameZh : protein.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex gap-2">
                            <span>{protein.molecularWeight}</span>
                            <span>•</span>
                            <span>{protein.chainCount} Chain(s)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Middle: 3D Viewer (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4 h-full">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex-1 relative">
                <Protein3DViewer protein={selectedProtein} language={language} />
            </div>
            {selectedProtein && (
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                    <h4 className="font-semibold text-slate-800 mb-1">{t('drug.details', language)}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {language === 'zh' ? selectedProtein.descriptionZh : selectedProtein.description}
                    </p>
                 </div>
            )}
        </div>

        {/* Right: Results & Mechanism (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
                <Box size={18} /> {t('drug.docking_title', language)}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {selectedProtein ? (
                    <>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                            <h5 className="text-sm font-medium text-slate-500 mb-2">{t('drug.docking_title', language)}</h5>
                            {simStatus === 'completed' ? (
                                <>
                                    <div className="text-3xl font-bold text-emerald-600 mb-1">{dockingResults.length}</div>
                                    <div className="text-xs text-slate-400">Compounds Screened</div>
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                         <p className="text-xs text-slate-500 mb-1">{t('drug.lead', language)}</p>
                                         <p className="font-bold text-slate-800 text-lg">{leadCandidate?.name}</p>
                                         <p className="text-xs text-blue-500 font-mono mt-1">{leadCandidate?.score} kcal/mol</p>
                                    </div>
                                </>
                            ) : simStatus === 'running' ? (
                                <div className="py-8">
                                    <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" />
                                    <span className="text-xs text-slate-500">{t('drug.simulating', language)}</span>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleInitiateSimulation}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Play size={16} fill="currentColor" />
                                    {t('drug.initiate', language)}
                                </button>
                            )}
                        </div>

                        {simStatus === 'completed' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="h-48 w-full">
                                    <h5 className="font-bold text-slate-700 text-xs mb-2 flex items-center gap-2">
                                        <FileOutput size={14} className="text-blue-500" />
                                        {t('drug.chart_y', language)}
                                    </h5>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dockingResults} layout="vertical" margin={{ left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                                            <Tooltip contentStyle={{fontSize: '12px'}} />
                                            <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                                {dockingResults.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Mechanism Visualization */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                                            <Beaker size={14} className="text-purple-500" />
                                            {t('drug.moi_title', language)}
                                        </h5>
                                        <div className="flex bg-slate-100 rounded p-0.5">
                                            <button 
                                                onClick={() => setMoiViewMode('2d')}
                                                className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${moiViewMode === '2d' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500'}`}
                                            >
                                                2D
                                            </button>
                                            <button 
                                                onClick={() => setMoiViewMode('3d')}
                                                className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${moiViewMode === '3d' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500'}`}
                                            >
                                                3D
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="h-48 border border-slate-200 rounded-lg bg-white overflow-hidden relative shadow-inner">
                                        {moiViewMode === '2d' ? (
                                            <div className="w-full h-full overflow-x-auto custom-scrollbar bg-slate-50/30">
                                                <div 
                                                    dangerouslySetInnerHTML={{ __html: generateMechanismSVG(leadCandidate?.name || '') }} 
                                                    className="origin-top-left transform scale-75"
                                                />
                                            </div>
                                        ) : (
                                            <LigandPocket3D drugName={leadCandidate?.name || ''} />
                                        )}
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-1">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{t('drug.moi_legend_lig', language)}</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span>{t('drug.moi_legend_res', language)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-slate-400 mt-10">
                        <p className="text-sm">{t('drug.select_prompt', language)}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DrugDiscovery;
