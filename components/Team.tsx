
import React from 'react';
import { TEAM_MEMBERS } from '../constants';
import { Language } from '../types';
import { t } from '../utils/translations';
import { User, Award, Users } from 'lucide-react';

interface Props {
  language: Language;
}

const Team: React.FC<Props> = ({ language }) => {
  const leader = TEAM_MEMBERS.find(m => m.role === 'Project Leader');
  const advisor = TEAM_MEMBERS.find(m => m.isAdvisor);
  const members = TEAM_MEMBERS.filter(m => m.role === 'Core Member');

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('team.title', language)}</h2>
        <p className="text-slate-500">{t('team.subtitle', language)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Leader Card */}
        {leader && (
            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-600 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                    <User size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{leader.name}</h3>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mt-2 mb-4">
                    {language === 'zh' ? leader.roleZh : leader.role}
                </span>
                <p className="text-slate-600 text-sm leading-relaxed">
                    {language === 'zh' ? leader.descriptionZh : leader.description}
                </p>
            </div>
        )}

        {/* Advisor Card */}
        {advisor && (
            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-emerald-500 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                    <Award size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{advisor.name}</h3>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mt-2 mb-4">
                    {language === 'zh' ? advisor.roleZh : advisor.role}
                </span>
                <p className="text-slate-600 text-sm leading-relaxed">
                    {language === 'zh' ? advisor.descriptionZh : advisor.description}
                </p>
            </div>
        )}
      </div>

      {/* Core Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Users className="text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800">{t('team.members', language)}</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member, idx) => (
                <div key={idx} className="group p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                            {member.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{member.name}</div>
                            <div className="text-xs text-slate-500">{language === 'zh' ? member.roleZh : member.role}</div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 pl-13">
                        {language === 'zh' ? member.descriptionZh : member.description}
                    </p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
