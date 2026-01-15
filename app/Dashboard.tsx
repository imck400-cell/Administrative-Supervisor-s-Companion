
import React from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Users, CheckCircle2, AlertCircle, FileText, 
  TrendingUp, Calendar, Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { lang, data } = useGlobal();

  const stats = [
    { 
      label: lang === 'ar' ? 'إجمالي الحصص الاحتياط' : 'Total Substitutions', 
      value: data.substitutions.length, 
      color: 'blue', 
      icon: <Users /> 
    },
    { 
      label: lang === 'ar' ? 'التقارير المكتملة' : 'Completed Reports', 
      value: data.dailyReports.length, 
      color: 'green', 
      icon: <CheckCircle2 /> 
    },
    { 
      label: lang === 'ar' ? 'حالات الغياب اليوم' : 'Absences Today', 
      value: 0, 
      color: 'red', 
      icon: <AlertCircle /> 
    },
    { 
      label: lang === 'ar' ? 'التكليفات الطارئة' : 'Emergency Tasks', 
      value: 0, 
      color: 'amber', 
      icon: <TrendingUp /> 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">
          {lang === 'ar' ? `مرحباً بك في سجل المشرف الاحترافي` : 'Welcome to Professional Supervisor Log'}
        </h2>
        <p className="text-slate-500">
          {lang === 'ar' ? 'نظام الإشراف الإداري والتربوي الرقمي' : 'Digital Administrative and Educational Supervision System'}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
              stat.color === 'green' ? 'bg-green-100 text-green-600' :
              stat.color === 'red' ? 'bg-red-100 text-red-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Calendar className="text-blue-500" />
            {lang === 'ar' ? 'بيانات المدرسة' : 'School Profile'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">{lang === 'ar' ? 'اسم المدرسة' : 'School Name'}</label>
              <div className="text-slate-700 font-semibold">{data.profile.schoolName || '---'}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">{lang === 'ar' ? 'المشرف' : 'Supervisor'}</label>
              <div className="text-slate-700 font-semibold">{data.profile.supervisorName || '---'}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">{lang === 'ar' ? 'العام الدراسي' : 'Academic Year'}</label>
              <div className="text-slate-700 font-semibold">{data.profile.year}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Clock className="text-green-500" />
            {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'تقرير يومي', icon: <FileText /> },
              { label: 'تغطية حصة', icon: <Users /> },
              { label: 'تعهد طالب', icon: <AlertCircle /> },
              { label: 'خطة إشراف', icon: <Calendar /> },
            ].map((btn, i) => (
              <button key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all gap-2 group">
                <span className="text-blue-500 group-hover:text-white">{btn.icon}</span>
                <span className="text-sm font-semibold">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
