
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface Props {
  language: Language;
}

const StatCard: React.FC<{ title: string; value: string; desc: string; icon: React.ReactNode; color: string }> = ({ title, value, desc, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} text-white`}>
                {icon}
            </div>
        </div>
        <p className="text-sm text-slate-400 mt-4 flex items-center gap-1">
            <ArrowUpRight size={14} className="text-emerald-500" />
            {desc}
        </p>
    </div>
);

const Dashboard: React.FC<Props> = ({ language }) => {
  const dataCost = [
    { name: t('dash.chart.cost', language), Traditional: 10000, AI_Model: 2850 },
  ];

  const dataTime = [
    { name: t('dash.chart.time', language), Traditional: 15, AI_Model: 3 },
  ];

  const dataAccuracy = [
    { name: t('dash.chart.accuracy', language), Traditional: 65, AI_Model: 92.7 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('dash.title', language)}</h2>
            <p className="text-slate-500">{t('dash.subtitle', language)}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                title={t('dash.accuracy', language)} 
                value="92.7%" 
                desc="+27% vs Traditional" 
                icon={<TrendingUp size={24} />} 
                color="bg-blue-600"
            />
            <StatCard 
                title={t('dash.cost', language)}
                value="¥2,850" 
                desc="Reduced by ~70%" 
                icon={<DollarSign size={24} />} 
                color="bg-emerald-600"
            />
            <StatCard 
                title={t('dash.time', language)}
                value="3 Days" 
                desc="12 days faster avg." 
                icon={<Clock size={24} />} 
                color="bg-indigo-600"
            />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-6 text-center">{t('dash.chart.cost', language)}</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataCost}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar name={t('dash.legend.trad', language)} dataKey="Traditional" fill="#94a3b8" />
                            <Bar name={t('dash.legend.ai', language)} dataKey="AI_Model" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-6 text-center">{t('dash.chart.time', language)}</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataTime}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar name={t('dash.legend.trad', language)} dataKey="Traditional" fill="#94a3b8" />
                            <Bar name={t('dash.legend.ai', language)} dataKey="AI_Model" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-6 text-center">{t('dash.chart.accuracy', language)}</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataAccuracy}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar name={t('dash.legend.trad', language)} dataKey="Traditional" fill="#94a3b8" />
                            <Bar name={t('dash.legend.ai', language)} dataKey="AI_Model" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
