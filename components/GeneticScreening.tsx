

import React, { useState } from 'react';
import { GENETIC_SAMPLES } from '../constants';
import { GeneticSample, Language } from '../types';
import { t } from '../utils/translations';
import { FileText, Activity, CheckCircle, Search, Dna, AlignLeft, AlertCircle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  language: Language;
}

const GeneticScreening: React.FC<Props> = ({ language }) => {
  const [selectedSample, setSelectedSample] = useState<GeneticSample | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'genomic' | 'cdna' | 'protein'>('genomic');
  // Default to collapsed so results below are visible
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(false);

  const handleSelectSample = (sample: GeneticSample) => {
    setSelectedSample(sample);
    setAnalysisComplete(false);
    setIsAnalyzing(false);
    setViewMode('genomic');
    setIsSequenceExpanded(false); 
  };

  const runAnalysis = () => {
    if (!selectedSample) return;
    setIsAnalyzing(true);
    // Simulate API processing delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 1500);
  };

  // Improved Sequence Grid Renderer
  const renderSequenceGrid = (sample: GeneticSample) => {
    let seq = '';
    let startPos = 1;
    let label = '';

    if (viewMode === 'genomic') {
      seq = sample.sequence;
      startPos = sample.startPosition;
      label = 'Genomic DNA (gDNA)';
    } else if (viewMode === 'cdna') {
      seq = sample.cdnaSequence;
      startPos = 1; 
      label = 'Complementary DNA (cDNA)';
    } else {
      seq = sample.proteinSequence;
      startPos = 1;
      label = 'Amino Acid Sequence (AA)';
    }

    const rowLength = 30; // 30 characters per row
    const totalRows = Math.ceil(seq.length / rowLength);
    const rows = [];

    // Map mutations to the current view
    const mutationsInView = sample.mutations.map(m => {
        if (viewMode === 'genomic') return m.position;
        if (viewMode === 'cdna') return m.position; 
        if (viewMode === 'protein') return Math.floor(m.position / 3); 
        return -1;
    });

    for (let r = 0; r < totalRows; r++) {
      const rowStart = r * rowLength;
      const rowEnd = Math.min(rowStart + rowLength, seq.length);
      const chunk = seq.substring(rowStart, rowEnd);
      const cells = [];

      for (let c = 0; c < chunk.length; c++) {
        const globalIndex = rowStart + c; // 0-based index in string
        const displayIndex = startPos + globalIndex;
        
        // Check if this index is a mutation site
        const isMutated = mutationsInView.some(pos => Math.abs(pos - (globalIndex + 1)) < 2); // Approximate hit

        cells.push(
          <div key={c} className="flex flex-col items-center gap-1 w-6 sm:w-8">
             <span className="text-[9px] text-slate-300 font-mono select-none">
                {(c % 5 === 0) ? (globalIndex + 1) : ''}
             </span>
             <div 
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-bold border rounded-sm font-mono transition-colors
                ${isMutated 
                    ? 'bg-red-500 text-white border-red-600 shadow-sm scale-110 z-10' 
                    : 'bg-white text-slate-700 border-slate-200'}`}
             >
                {chunk[c]}
             </div>
             {isMutated && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 animate-pulse"></div>
             )}
          </div>
        );
      }

      rows.push(
        <div key={r} className="flex items-end gap-1 mb-3 flex-wrap">
            <div className="w-16 text-[10px] text-slate-400 font-mono text-right mr-2 mb-2 select-none">
                {startPos + rowStart}
            </div>
            {cells}
        </div>
      );
    }

    return (
        <div className="relative border border-slate-200 rounded-lg bg-slate-50 overflow-hidden flex flex-col transition-all">
            <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 backdrop-blur-sm sticky top-0 z-20">
                {label}
            </div>
            
            <div 
                className={`p-4 font-mono overflow-x-auto custom-scrollbar transition-all duration-500 ease-in-out ${
                    // Compact height when collapsed to ensure users see results below
                    isSequenceExpanded ? 'max-h-[800px]' : 'max-h-[180px]'
                }`}
            >
                {rows}
            </div>

            {/* Fade overlay when collapsed */}
            {!isSequenceExpanded && (
                <div className="absolute bottom-10 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsSequenceExpanded(!isSequenceExpanded)}
                className="w-full py-2 bg-white border-t border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 z-20"
            >
                {isSequenceExpanded ? (
                    <>
                        <ChevronUp size={14} /> {t('screen.collapse_seq', language)}
                    </>
                ) : (
                    <>
                        <ChevronDown size={14} /> {t('screen.expand_seq', language)}
                    </>
                )}
            </button>
        </div>
    );
  };

  // Chromosome Visualizer Component
  const ChromosomeVisualizer = ({ sample }: { sample: GeneticSample }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 relative overflow-hidden">
             <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    {t('screen.chr_loc', language)}
                </h4>
                <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Chr {sample.chromosome}: {sample.cytoband}
                </div>
             </div>
             
             <div className="relative h-16 w-full bg-slate-50 rounded-full border border-slate-200 flex items-center px-4 overflow-hidden">
                {/* Simulated Chromosome Banding */}
                <div className="absolute inset-0 flex w-full opacity-10">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-slate-800' : 'bg-transparent'}`}></div>
                    ))}
                </div>
                
                {/* Centromere constriction simulation */}
                <div className="absolute left-[40%] top-0 bottom-0 w-8 bg-white opacity-80 rounded-full scale-y-75 transform"></div>

                {/* Marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 left-[60%] shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                    <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                        !
                    </div>
                </div>
                <div className="absolute top-1/2 left-[60%] ml-2 -translate-y-1/2 text-xs font-bold text-red-600 bg-white/80 px-2 py-0.5 rounded border border-red-100 shadow-sm">
                    {sample.geneTarget}
                </div>
             </div>
             
             <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono uppercase px-2">
                <span>p-arm (Short)</span>
                <span>Centromere</span>
                <span>q-arm (Long)</span>
             </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('screen.title', language)}</h2>
          <p className="text-slate-500">{t('screen.subtitle', language)}</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm border border-blue-100 flex items-center gap-2">
            <Activity size={16} />
            {t('screen.accuracy_badge', language)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: File List (1 Col) */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
            <FileText size={18} /> {t('screen.list_title', language)}
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1">
            {GENETIC_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                  selectedSample?.id === sample.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-slate-800">{sample.geneTarget} <span className="text-slate-400 font-normal text-xs">| {sample.locus}</span></div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{sample.filename.split('.').pop()}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">{sample.filename}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>ID: {sample.patientId}</span>
                    <span className="font-mono">Chr{sample.chromosome}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50">
             <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm hover:border-blue-400 hover:text-blue-500 transition-colors">
                {t('screen.upload_btn', language)}
             </button>
          </div>
        </div>

        {/* Right: Analysis Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSample ? (
            <>
              {/* Top: Chromosome & Basic Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Dna className="text-blue-600" />
                            {selectedSample.geneTarget} Analysis
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Locus: <span className="font-mono font-semibold text-slate-700">{selectedSample.locus}</span> | 
                            Ref Genome: <span className="font-mono text-slate-600">GRCh38</span>
                        </p>
                    </div>
                    {!analysisComplete && (
                        <button
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        className={`px-6 py-2 rounded-lg font-semibold text-white transition-all text-sm flex items-center gap-2 ${
                            isAnalyzing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                        >
                        {isAnalyzing ? <Activity className="animate-spin" size={16}/> : <Search size={16}/>}
                        {isAnalyzing ? t('screen.processing', language) : t('screen.run_btn', language)}
                        </button>
                     )}
                </div>

                {/* Figure 1: Chromosome Location */}
                <ChromosomeVisualizer sample={selectedSample} />

                {/* Figure 2 & 3: Sequence Viewer Tabs */}
                <div className="border-b border-slate-200 mb-4">
                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setViewMode('genomic'); setIsSequenceExpanded(false); }}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'genomic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('screen.dna_view', language)}
                        </button>
                        <button 
                            onClick={() => { setViewMode('cdna'); setIsSequenceExpanded(false); }}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'cdna' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('screen.cdna_view', language)}
                        </button>
                        <button 
                            onClick={() => { setViewMode('protein'); setIsSequenceExpanded(false); }}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'protein' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('screen.protein_view', language)}
                        </button>
                    </div>
                </div>

                {/* Sequence Grid View */}
                {renderSequenceGrid(selectedSample)}
              </div>

              {/* Bottom: Results Section */}
              {analysisComplete && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle size={20} />
                      {t('screen.result_title', language)}
                    </h3>
                    <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-white rounded-full border border-emerald-200">
                        {t('screen.accuracy_badge', language)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3">{t('screen.col_pos', language)}</th>
                          <th className="px-6 py-3">{t('screen.col_change', language)}</th>
                          <th className="px-6 py-3">{t('screen.col_type', language)}</th>
                          <th className="px-6 py-3">{t('screen.col_disease', language)}</th>
                          <th className="px-6 py-3 text-right">{t('screen.col_score', language)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedSample.mutations.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono text-slate-600">{m.position}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{m.cdsChange}</div>
                                <div className="text-xs text-slate-500">{m.aaChange}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                    ${m.impact === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {language === 'zh' ? m.typeZh : m.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{language === 'zh' ? m.associatedDiseaseZh : m.associatedDisease}</td>
                            <td className="px-6 py-4 text-right">
                                <span className="font-bold text-slate-800">{m.score}</span>
                                <span className="text-xs text-slate-400">/100</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                    {t('screen.disclaimer', language)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed p-12">
              <Dna size={64} className="mb-4 opacity-20" />
              <p>{t('screen.select_prompt', language)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneticScreening;
