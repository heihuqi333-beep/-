import React, { useState } from 'react';
import { LayoutDashboard, Dna, Microscope, Menu, X, Globe, Users } from 'lucide-react';
import GeneticScreening from './components/GeneticScreening';
import DrugDiscovery from './components/DrugDiscovery';
import Dashboard from './components/Dashboard';
import Team from './components/Team';
import { TabView, Language } from './types';
import { t } from './utils/translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', language), icon: <LayoutDashboard size={20} /> },
    { id: 'screening', label: t('nav.screening', language), icon: <Dna size={20} /> },
    { id: 'drug-discovery', label: t('nav.drugDiscovery', language), icon: <Microscope size={20} /> },
    { id: 'team', label: t('nav.team', language), icon: <Users size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                AI
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">BioGenAI</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Medical Intelligence</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 items-center">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabView)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === item.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              
              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <Globe size={14} />
                {language === 'en' ? 'EN / 中文' : '中文 / EN'}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={toggleLanguage}
                className="text-slate-600 font-bold text-sm"
              >
                {language === 'en' ? 'ZH' : 'EN'}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-500 hover:text-slate-900 p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabView);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-4 text-base font-medium rounded-md ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard language={language} />}
        {activeTab === 'screening' && <GeneticScreening language={language} />}
        {activeTab === 'drug-discovery' && <DrugDiscovery language={language} />}
        {activeTab === 'team' && <Team language={language} />}
      </main>

      {/* Footer - Minimal/Transparent */}
      <footer className="mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center space-y-1 opacity-50 hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-slate-500">
              &copy; 2025 {t('footer.rights', language)}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{t('footer.version', language)}</span>
              <span className="w-0.5 h-0.5 bg-slate-400 rounded-full"></span>
              <span>Compliance: HIPAA/GDPR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;