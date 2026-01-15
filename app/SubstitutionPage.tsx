
import React, { useState, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

const SubstitutionPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();

  // الحصول على قائمة المعلمين المضافين في تقارير المتابعة لمنع تكرار الإدخال اليدوي
  const teacherList = useMemo(() => {
    const names = new Set<string>();
    data.dailyReports.forEach(report => {
      report.teachersData.forEach(t => {
        if (t.teacherName) names.add(t.teacherName);
      });
    });
    return Array.from(names);
  }, [data.dailyReports]);

  const handleAddRow = () => {
    const newEntry = {
      id: Date.now().toString(),
      absentTeacher: '',
      replacementTeacher: '',
      period: '',
      class: '',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'pending',
      // إضافة حقول الحصص من 1 إلى 7 كما في الصورة
      p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: '',
      signature: ''
    };
    updateData({ substitutions: [...data.substitutions, newEntry as any] });
  };

  const updateEntry = (id: string, field: string, value: string) => {
    const newList = data.substitutions.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    updateData({ substitutions: newList });
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      updateData({ substitutions: data.substitutions.filter(s => s.id !== id) });
    }
  };

  return (
    <div className="space-y-4 font-arabic">
      <div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800">تغطية الحصص</h2>
        <button 
          onClick={handleAddRow}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5" /> إضافة معلم غائب
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-black border-b-2 border-slate-300">
                <th rowSpan={2} className="border-e border-slate-300 p-2 w-12">م</th>
                <th rowSpan={2} className="border-e border-slate-300 p-2 w-48">الغائب</th>
                <th className="border-e border-slate-300 p-2 w-32">الحصة</th>
                <th className="border-e border-slate-300 p-2">1</th>
                <th className="border-e border-slate-300 p-2">2</th>
                <th className="border-e border-slate-300 p-2">3</th>
                <th className="border-e border-slate-300 p-2">4</th>
                <th className="border-e border-slate-300 p-2">5</th>
                <th className="border-e border-slate-300 p-2">6</th>
                <th className="border-e border-slate-300 p-2">7</th>
                <th rowSpan={2} className="p-2 w-12"></th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b-2 border-slate-300">
                <th className="border-e border-slate-300 p-1 text-xs">البديل / التوقيع</th>
                <th colSpan={7} className="border-e border-slate-300 p-1 text-[10px]">تغطية الحصص الدراسية</th>
              </tr>
            </thead>
            <tbody>
              {data.substitutions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-slate-400 italic">لا توجد بيانات تغطية حالياً. اضغط على زر الإضافة للبدء.</td>
                </tr>
              ) : (
                data.substitutions.map((row: any, idx) => (
                  <React.Fragment key={row.id}>
                    {/* الصف العلوي (البديل) */}
                    <tr className="border-b border-slate-200">
                      <td rowSpan={2} className="border-e border-slate-300 font-black bg-slate-50">{idx + 1}</td>
                      <td rowSpan={2} className="border-e border-slate-300 p-0 bg-[#FFF2CC]">
                        <input 
                          list={`teachers-${row.id}`}
                          className="w-full p-3 bg-transparent text-center font-bold outline-none border-none focus:bg-white transition-colors"
                          placeholder="اسم الغائب..."
                          value={row.absentTeacher}
                          onChange={(e) => updateEntry(row.id, 'absentTeacher', e.target.value)}
                        />
                        <datalist id={`teachers-${row.id}`}>
                          {teacherList.map(name => <option key={name} value={name} />)}
                        </datalist>
                      </td>
                      <td className="border-e border-slate-300 p-2 bg-slate-50 font-black text-xs">البديل</td>
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <td key={num} className="border-e border-slate-300 p-0 bg-[#E2EFDA]/30">
                          <input 
                            list={`teachers-p${num}-${row.id}`}
                            className="w-full p-2 text-center text-xs outline-none bg-transparent focus:bg-white"
                            value={row[`p${num}`] || ''}
                            onChange={(e) => updateEntry(row.id, `p${num}`, e.target.value)}
                          />
                          <datalist id={`teachers-p${num}-${row.id}`}>
                            {teacherList.map(name => <option key={name} value={name} />)}
                          </datalist>
                        </td>
                      ))}
                      <td rowSpan={2} className="p-2">
                        <button onClick={() => handleDelete(row.id)} className="text-red-300 hover:text-red-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    {/* صف التوقيع */}
                    <tr className="border-b-2 border-slate-300">
                      <td className="border-e border-slate-300 p-2 bg-slate-50 font-black text-[10px]">التوقيع</td>
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <td key={`sig-${num}`} className="border-e border-slate-300 p-1 bg-white">
                          {row[`sig${num}`] === 'تمت الموافقة' ? (
                            <div className="text-green-600 font-black text-[9px] flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3" /> تمت الموافقة
                            </div>
                          ) : (
                            <button 
                              onClick={() => updateEntry(row.id, `sig${num}`, 'تمت الموافقة')}
                              className="text-[9px] bg-slate-100 px-2 py-1 rounded border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                              توقيع
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionPage;
