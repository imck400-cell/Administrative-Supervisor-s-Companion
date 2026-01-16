
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGlobal } from '../context/GlobalState';
import { Plus, Search, Trash2, Filter, ChevronDown, Check, Calendar, Percent, User, Target, Settings2, AlertCircle, X, ChevronRight, Zap, CheckCircle, FilePlus, FolderOpen, Save, ListOrdered, ArrowUpDown, ArrowUp, ArrowDown, SortAsc, Book, School, Type, Sparkles, FilterIcon, BarChart3, LayoutList, Upload, Download, Phone, UserCircle, Activity } from 'lucide-react';
import { TeacherFollowUp, DailyReportContainer, StudentReport } from '../types';
import DynamicTable from '../components/DynamicTable';
import * as XLSX from 'xlsx';

// Adding local types for TeacherFollowUpPage sorting and filtering
type FilterMode = 'all' | 'student' | 'percent' | 'metric' | 'grade' | 'section' | 'specific';
type SortCriteria = 'manual' | 'name' | 'subject' | 'class';
type SortDirection = 'asc' | 'desc';

export const StudentsReportsPage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterValue, setFilterValue] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState<{id: string, text: string} | null>(null);
  const [metricFilterMode, setMetricFilterMode] = useState(false);
  const [showSpecificFilterModal, setShowSpecificFilterModal] = useState(false);
  const [selectedSpecifics, setSelectedSpecifics] = useState<string[]>([]);

  const studentData = data.studentReports || [];

  const optionsAr = {
    gender: ["ذكر", "أنثى"],
    workOutside: ["لا يعمل", "يعمل"],
    health: ["ممتاز", "مريض"],
    level: ["ممتاز", "متوسط", "جيد", "ضعيف", "ضعيف جداً"],
    behavior: ["ممتاز", "متوسط", "جيد", "جيد جدا", "مقبول", "ضعيف", "ضعيف جدا"],
    mainNotes: ["ممتاز", "كثير الكلام", "كثير الشغب", "عدواني", "تطاول على معلم", "اعتداء على طالب جسدياً", "اعتداء على طالب لفظيا", "أخذ أدوات الغير دون أذنهم", "إتلاف ممتلكات طالب", "إتلاف ممتلكات المدرسة"],
    eduStatus: ["متعلم", "ضعيف", "أمي"],
    followUp: ["ممتازة", "متوسطة", "ضعيفة"],
    cooperation: ["ممتازة", "متوسطة", "ضعيفة", "متذمر", "كثير النقد", "عدواني"],
    grades: ["التمهيدي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
    sections: ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"]
  };

  const optionsEn = {
    gender: ["Male", "Female"],
    workOutside: ["Doesn't Work", "Works"],
    health: ["Excellent", "Ill"],
    level: ["Excellent", "Average", "Good", "Weak", "Very Weak"],
    behavior: ["Excellent", "Average", "Good", "Very Good", "Acceptable", "Weak", "Very Weak"],
    mainNotes: ["Excellent", "Talkative", "Riotous", "Aggressive", "Teacher Assault", "Physical Assault", "Verbal Assault", "Stealing", "Property Damage", "School Damage"],
    eduStatus: ["Educated", "Weak", "Illiterate"],
    followUp: ["Excellent", "Average", "Weak"],
    cooperation: ["Excellent", "Average", "Weak", "Complaining", "Critical", "Aggressive"],
    grades: ["Pre-K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"],
    sections: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
  };

  const options = lang === 'ar' ? optionsAr : optionsEn;

  const metricLabels: Record<string, string> = lang === 'ar' ? {
    gender: "النوع",
    grade: "الصف",
    section: "الشعبة",
    workOutside: "العمل خارج المدرسة",
    healthStatus: "الحالة الصحية",
    academicReading: "القراءة",
    academicWriting: "الكتابة",
    behaviorLevel: "المستوى السلوكي",
    guardianEducation: "تعليم ولي الأمر",
    guardianFollowUp: "متابعة ولي الأمر",
    guardianCooperation: "تعاون ولي الأمر"
  } : {
    gender: "Gender",
    grade: "Grade",
    section: "Section",
    workOutside: "Work Outside",
    healthStatus: "Health Status",
    academicReading: "Reading",
    academicWriting: "Writing",
    behaviorLevel: "Behavior Level",
    guardianEducation: "Guardian Education",
    guardianFollowUp: "Guardian Follow-up",
    guardianCooperation: "Guardian Cooperation"
  };

  const updateStudent = (id: string, field: string, value: any) => {
    const updated = studentData.map(s => s.id === id ? { ...s, [field]: value } : s);
    updateData({ studentReports: updated });
  };

  const addStudent = () => {
    const newStudent: StudentReport = {
      id: Date.now().toString(),
      name: '',
      gender: options.gender[0],
      grade: options.grades[0],
      section: options.sections[0],
      address: '',
      workOutside: options.workOutside[0],
      healthStatus: options.health[0],
      healthDetails: '',
      guardianName: '',
      guardianPhones: [''],
      academicReading: options.level[0],
      academicWriting: options.level[0],
      academicParticipation: options.level[0],
      behaviorLevel: options.behavior[0],
      mainNotes: [],
      otherNotesText: '',
      guardianEducation: options.eduStatus[0],
      guardianFollowUp: options.followUp[0],
      guardianCooperation: options.cooperation[0],
      notes: '',
      createdAt: new Date().toISOString()
    };
    updateData({ studentReports: [...studentData, newStudent] });
  };

  const bulkAutoFill = () => {
    if (!confirm(lang === 'ar' ? 'سيتم تعبئة الخيار الأول لجميع الحقول في كافة الطلاب. استمرار؟' : 'Auto-fill first option for all students?')) return;
    const updated = studentData.map(s => ({
      ...s,
      healthStatus: optionsAr.health[0],
      guardianFollowUp: optionsAr.followUp[0],
      guardianEducation: optionsAr.eduStatus[0],
      guardianCooperation: optionsAr.cooperation[0],
      academicReading: optionsAr.level[0],
      academicWriting: optionsAr.level[0],
      academicParticipation: optionsAr.level[0],
      behaviorLevel: optionsAr.behavior[0],
      workOutside: optionsAr.workOutside[0],
    }));
    updateData({ studentReports: updated });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const dataXLSX = XLSX.utils.sheet_to_json(ws);
      const imported = dataXLSX.map((row: any) => ({
        id: Date.now().toString() + Math.random(),
        name: row['اسم الطالب'] || '',
        gender: row['النوع'] || optionsAr.gender[0],
        grade: row['الصف'] || optionsAr.grades[0],
        section: row['الشعبة'] || optionsAr.sections[0],
        address: row['عنوان السكن'] || '',
        workOutside: row['العمل'] || optionsAr.workOutside[0],
        healthStatus: row['الحالة الصحية'] || optionsAr.health[0],
        guardianName: row['ولي الأمر'] || '',
        guardianPhones: [row['الهاتف'] || ''],
        academicReading: optionsAr.level[0], academicWriting: optionsAr.level[0], academicParticipation: optionsAr.level[0],
        behaviorLevel: optionsAr.behavior[0], mainNotes: [], otherNotesText: '', guardianEducation: optionsAr.eduStatus[0],
        guardianFollowUp: optionsAr.followUp[0], guardianCooperation: optionsAr.cooperation[0], notes: '', createdAt: new Date().toISOString()
      }));
      updateData({ studentReports: [...studentData, ...imported as any] });
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = useMemo(() => {
    let result = [...studentData];
    if (filterMode === 'student' && filterValue) result = result.filter(s => s.name.includes(filterValue));
    if (filterMode === 'grade' && filterValue) result = result.filter(s => s.grade === filterValue);
    if (filterMode === 'section' && filterValue) result = result.filter(s => s.section === filterValue);
    if (filterMode === 'specific' && selectedSpecifics.length > 0) {
      result = result.filter(s => 
        selectedSpecifics.includes(s.healthStatus) || 
        selectedSpecifics.includes(s.behaviorLevel) || 
        selectedSpecifics.includes(s.grade) ||
        selectedSpecifics.includes(s.section) ||
        s.mainNotes.some(n => selectedSpecifics.includes(n))
      );
    }
    return result;
  }, [studentData, filterMode, filterValue, selectedSpecifics]);

  // Determine if we are in "Metric Only" view
  const isOnlyMetricView = filterMode === 'metric' && activeMetricFilter.length > 0;

  return (
    <div className="space-y-4 font-arabic animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3">
          <button onClick={addStudent} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 shadow-md transform active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> {lang === 'ar' ? 'إضافة طالب' : 'Add Student'}
          </button>
          <label className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-green-200 cursor-pointer hover:bg-green-100 transition-all">
            <Upload className="w-4 h-4" /> {lang === 'ar' ? 'استيراد ملف' : 'Import File'}
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </label>
          <button onClick={bulkAutoFill} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-purple-200 hover:bg-purple-100 transition-all">
            <Sparkles className="w-4 h-4" /> {lang === 'ar' ? 'التعبئة التلقائية' : 'Auto Fill'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowFilterModal(!showFilterModal)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${showFilterModal ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Filter className="w-4 h-4" /> {lang === 'ar' ? 'فلترة متقدمة' : 'Advanced Filter'}
            </button>
            {showFilterModal && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[100] animate-in fade-in zoom-in duration-200 space-y-4 text-right">
                 <button onClick={() => { setFilterMode('all'); setActiveMetricFilter([]); setShowFilterModal(false); }} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'الجميع' : 'All'} {filterMode === 'all' && <Check className="w-4 h-4"/>}</button>
                 <button onClick={() => { setFilterMode('student'); setShowFilterModal(false); }} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'حسب الطالب' : 'By Student'} {filterMode === 'student' && <Check className="w-4 h-4"/>}</button>
                 <button onClick={() => { setMetricFilterMode(true); setShowFilterModal(false); }} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'حسب المعيار' : 'By Metric'} {isOnlyMetricView && <Check className="w-4 h-4"/>}</button>
                 <button onClick={() => { setShowSpecificFilterModal(true); setShowFilterModal(false); }} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'حسب صفة معينة' : 'By Feature'} {filterMode === 'specific' && <Check className="w-4 h-4"/>}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-center border-collapse table-auto ${isOnlyMetricView ? 'min-w-[800px]' : 'min-w-[2200px]'}`}>
            <thead className="bg-[#FFD966] text-slate-800 sticky top-0 z-20">
              <tr className="border-b border-slate-300 h-12">
                <th rowSpan={2} className="px-4 border-e border-slate-300 min-w-[150px]">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                <th rowSpan={2} className="px-4 border-e border-slate-300 w-24">{lang === 'ar' ? 'الصف' : 'Grade'}</th>
                <th rowSpan={2} className="px-4 border-e border-slate-300 w-24">{lang === 'ar' ? 'الشعبة' : 'Section'}</th>
                
                {!isOnlyMetricView && (
                  <>
                    <th rowSpan={2} className="px-4 border-e border-slate-300">{lang === 'ar' ? 'النوع' : 'Gender'}</th>
                    <th rowSpan={2} className="px-4 border-e border-slate-300">{lang === 'ar' ? 'السكن / العمل' : 'Residence / Work'}</th>
                    <th rowSpan={2} className="px-4 border-e border-slate-300">{lang === 'ar' ? 'الحالة الصحية' : 'Health Status'}</th>
                    <th rowSpan={2} className="px-4 border-e border-slate-300">{lang === 'ar' ? 'ولي الأمر (الاسم/الهواتف)' : 'Guardian (Name/Phones)'}</th>
                    <th colSpan={3} className="px-4 border-e border-slate-300 bg-[#FFF2CC]">{lang === 'ar' ? 'المستوى العلمي' : 'Academic Level'}</th>
                    <th rowSpan={2} className="px-4 border-e border-slate-300">{lang === 'ar' ? 'المستوى السلوكي' : 'Behavior Level'}</th>
                    <th rowSpan={2} className="px-4 border-e border-slate-300">{lang === 'ar' ? 'الملاحظات الأساسية' : 'Main Notes'}</th>
                    <th colSpan={3} className="px-4 border-e border-slate-300 bg-[#DDEBF7]">{lang === 'ar' ? 'ولي الأمر المتابع' : 'Guardian Follow-up'}</th>
                    <th rowSpan={2} className="px-4">{lang === 'ar' ? 'ملاحظات أخرى' : 'Other Notes'}</th>
                  </>
                )}
                
                {isOnlyMetricView && activeMetricFilter.map(mKey => (
                  <th key={mKey} className="px-4 border-e border-slate-300">{metricLabels[mKey]}</th>
                ))}
              </tr>
              
              {!isOnlyMetricView && (
                <tr className="bg-[#F2F2F2] text-[10px] h-10">
                  <th className="border-e border-slate-300 bg-[#FFF2CC]/50">{lang === 'ar' ? 'قراءة' : 'Read'}</th>
                  <th className="border-e border-slate-300 bg-[#FFF2CC]/50">{lang === 'ar' ? 'كتابة' : 'Write'}</th>
                  <th className="border-e border-slate-300 bg-[#FFF2CC]/50">{lang === 'ar' ? 'مشاركة' : 'Part'}</th>
                  <th className="border-e border-slate-300 bg-[#DDEBF7]/50">{lang === 'ar' ? 'تعليم' : 'Edu'}</th>
                  <th className="border-e border-slate-300 bg-[#DDEBF7]/50">{lang === 'ar' ? 'متابعة' : 'Follow'}</th>
                  <th className="border-e border-slate-300 bg-[#DDEBF7]/50">{lang === 'ar' ? 'تعاون' : 'Coop'}</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((s, idx) => (
                <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-2 border-e border-slate-100">
                    <input className="w-full bg-transparent border-none outline-none font-bold text-sm" value={s.name} onChange={(e) => updateStudent(s.id, 'name', e.target.value)} />
                  </td>
                  <td className="p-2 border-e border-slate-100">
                    <select className="bg-transparent font-bold text-[10px] outline-none w-full" value={s.grade} onChange={(e) => updateStudent(s.id, 'grade', e.target.value)}>
                      {optionsAr.grades.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.grades[optionsAr.grades.indexOf(o)]}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border-e border-slate-100">
                    <select className="bg-transparent font-bold text-[10px] outline-none w-full" value={s.section} onChange={(e) => updateStudent(s.id, 'section', e.target.value)}>
                      {optionsAr.sections.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.sections[optionsAr.sections.indexOf(o)]}</option>)}
                    </select>
                  </td>

                  {!isOnlyMetricView && (
                    <>
                      <td className="p-2 border-e border-slate-100">
                        <select className="bg-transparent font-bold text-xs outline-none" value={s.gender} onChange={(e) => updateStudent(s.id, 'gender', e.target.value)}>
                          {optionsAr.gender.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.gender[optionsAr.gender.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100">
                        <div className="flex flex-col gap-1">
                          <input className="w-full text-xs" value={s.address} onChange={(e) => updateStudent(s.id, 'address', e.target.value)} placeholder="..." />
                          <select className="text-[10px] bg-slate-50" value={s.workOutside} onChange={(e) => updateStudent(s.id, 'workOutside', e.target.value)}>
                            {optionsAr.workOutside.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.workOutside[optionsAr.workOutside.indexOf(o)]}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="p-2 border-e border-slate-100">
                        <div className="flex flex-col gap-1">
                          <select className="text-xs font-bold" value={s.healthStatus} onChange={(e) => updateStudent(s.id, 'healthStatus', e.target.value)}>
                            {optionsAr.health.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.health[optionsAr.health.indexOf(o)]}</option>)}
                          </select>
                          {s.healthStatus === 'مريض' && <input className="text-[10px]" value={s.healthDetails} onChange={(e) => updateStudent(s.id, 'healthDetails', e.target.value)} />}
                        </div>
                      </td>
                      <td className="p-2 border-e border-slate-100">
                        <div className="flex flex-col gap-1">
                          <input className="text-xs font-bold" value={s.guardianName} onChange={(e) => updateStudent(s.id, 'guardianName', e.target.value)} />
                          {s.guardianPhones.map((p, i) => (
                            <div key={i} className="flex gap-1">
                              <input className="text-[10px] w-24" value={p} onChange={(e) => {
                                const newP = [...s.guardianPhones]; newP[i] = e.target.value; updateStudent(s.id, 'guardianPhones', newP);
                              }} />
                              {i === s.guardianPhones.length - 1 && <button onClick={() => updateStudent(s.id, 'guardianPhones', [...s.guardianPhones, ''])} className="text-blue-500"><Plus size={12}/></button>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border-e border-slate-100 bg-[#FFF2CC]/10">
                        <select className="text-[10px] w-full" value={s.academicReading} onChange={(e) => updateStudent(s.id, 'academicReading', e.target.value)}>
                          {optionsAr.level.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.level[optionsAr.level.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100 bg-[#FFF2CC]/10">
                        <select className="text-[10px] w-full" value={s.academicWriting} onChange={(e) => updateStudent(s.id, 'academicWriting', e.target.value)}>
                          {optionsAr.level.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.level[optionsAr.level.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100 bg-[#FFF2CC]/10">
                        <select className="text-[10px] w-full" value={s.academicParticipation} onChange={(e) => updateStudent(s.id, 'academicParticipation', e.target.value)}>
                          {optionsAr.level.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.level[optionsAr.level.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100">
                        <select className="text-[10px] font-bold w-full" value={s.behaviorLevel} onChange={(e) => updateStudent(s.id, 'behaviorLevel', e.target.value)}>
                          {optionsAr.behavior.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.behavior[optionsAr.behavior.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100">
                        <div className="flex flex-wrap gap-1 justify-center max-w-[200px]">
                          {optionsAr.mainNotes.map((n, nIdx) => (
                            <button key={n} onClick={() => {
                              const newN = s.mainNotes.includes(n) ? s.mainNotes.filter(x => x !== n) : [...s.mainNotes, n];
                              updateStudent(s.id, 'mainNotes', newN);
                            }} className={`text-[8px] p-1 rounded border ${s.mainNotes.includes(n) ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                              {lang === 'ar' ? n : optionsEn.mainNotes[nIdx]}
                            </button>
                          ))}
                          <input className="text-[8px] border-b w-full mt-1" value={s.otherNotesText} onChange={(e) => updateStudent(s.id, 'otherNotesText', e.target.value)} />
                        </div>
                      </td>
                      <td className="p-2 border-e border-slate-100 bg-[#DDEBF7]/10">
                        <select className="text-[9px] w-full" value={s.guardianEducation} onChange={(e) => updateStudent(s.id, 'guardianEducation', e.target.value)}>
                          {optionsAr.eduStatus.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.eduStatus[optionsAr.eduStatus.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100 bg-[#DDEBF7]/10">
                        <select className="text-[9px] w-full" value={s.guardianFollowUp} onChange={(e) => updateStudent(s.id, 'guardianFollowUp', e.target.value)}>
                          {optionsAr.followUp.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.followUp[optionsAr.followUp.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border-e border-slate-100 bg-[#DDEBF7]/10">
                        <select className="text-[9px] w-full" value={s.guardianCooperation} onChange={(e) => updateStudent(s.id, 'guardianCooperation', e.target.value)}>
                          {optionsAr.cooperation.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.cooperation[optionsAr.cooperation.indexOf(o)]}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <button onClick={() => setShowNotesModal({id: s.id, text: s.notes})} className="p-2 bg-slate-100 hover:bg-blue-100 rounded-xl transition-all">
                          {s.notes ? <CheckCircle size={16} className="text-green-500" /> : <Settings2 size={16} className="text-slate-400" />}
                        </button>
                      </td>
                    </>
                  )}

                  {isOnlyMetricView && activeMetricFilter.map(mKey => {
                    const currentVal = (s as any)[mKey];
                    // Find options group for select if exists
                    const optKey = mKey === 'healthStatus' ? 'health' : (mKey === 'academicReading' || mKey === 'academicWriting') ? 'level' : mKey;
                    const possibleOpts = (optionsAr as any)[optKey] || [];
                    
                    return (
                      <td key={mKey} className="p-2 border-e border-slate-100 bg-blue-50/10">
                        {possibleOpts.length > 0 ? (
                          <select 
                            className="text-[10px] w-full bg-transparent font-bold outline-none" 
                            value={currentVal} 
                            onChange={(e) => updateStudent(s.id, mKey, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                // Jump to next student's same field
                                const nextRow = e.currentTarget.closest('tr')?.nextElementSibling;
                                const nextInput = nextRow?.querySelector(`td:nth-child(${e.currentTarget.closest('td')?.cellIndex! + 1}) select`) as HTMLSelectElement;
                                if (nextInput) nextInput.focus();
                              }
                            }}
                          >
                            {possibleOpts.map((o: string) => <option key={o} value={o}>{lang === 'ar' ? o : (optionsEn as any)[optKey]?.[(optionsAr as any)[optKey].indexOf(o)] || o}</option>)}
                          </select>
                        ) : (
                          <input 
                            className="text-[10px] w-full bg-transparent font-bold text-center outline-none" 
                            value={currentVal} 
                            onChange={(e) => updateStudent(s.id, mKey, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const nextRow = e.currentTarget.closest('tr')?.nextElementSibling;
                                const nextInput = nextRow?.querySelector(`td:nth-child(${e.currentTarget.closest('td')?.cellIndex! + 1}) input`) as HTMLInputElement;
                                if (nextInput) nextInput.focus();
                              }
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metric Filter Modal */}
      {metricFilterMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-black text-slate-800 text-right">{lang === 'ar' ? 'اختر المعايير المراد عرضها' : 'Choose Metrics to Show'}</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(metricLabels).map(m => (
                <button key={m} onClick={() => setActiveMetricFilter(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} className={`p-2 rounded-xl text-xs font-bold border-2 transition-all ${activeMetricFilter.includes(m) ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                  {metricLabels[m]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFilterMode('metric'); setMetricFilterMode(false); }} className="flex-1 bg-blue-600 text-white p-3 rounded-2xl font-black">{lang === 'ar' ? 'تطبيق' : 'Apply'}</button>
              <button onClick={() => setMetricFilterMode(false)} className="bg-slate-100 text-slate-500 p-3 rounded-2xl font-black">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Specific Filter Modal */}
      {showSpecificFilterModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between border-b pb-2 mb-4">
              <h3 className="font-black">{lang === 'ar' ? 'فلترة حسب صفة معينة' : 'Filter by Specific Feature'}</h3>
              <button onClick={() => setShowSpecificFilterModal(false)}><X/></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
              {Object.entries(optionsAr).map(([key, vals]) => {
                const label = key === 'gender' ? (lang === 'ar' ? 'النوع' : 'Gender') : 
                              key === 'workOutside' ? (lang === 'ar' ? 'العمل' : 'Work') : 
                              key === 'health' ? (lang === 'ar' ? 'الصحة' : 'Health') :
                              key === 'level' ? (lang === 'ar' ? 'المستوى' : 'Level') :
                              key === 'behavior' ? (lang === 'ar' ? 'السلوك' : 'Behavior') :
                              key === 'mainNotes' ? (lang === 'ar' ? 'الملاحظات' : 'Notes') :
                              key === 'eduStatus' ? (lang === 'ar' ? 'التعليم' : 'Education') :
                              key === 'followUp' ? (lang === 'ar' ? 'المتابعة' : 'Follow-up') :
                              key === 'cooperation' ? (lang === 'ar' ? 'التعاون' : 'Cooperation') :
                              key === 'grades' ? (lang === 'ar' ? 'الصفوف' : 'Grades') :
                              key === 'sections' ? (lang === 'ar' ? 'الشعب' : 'Sections') : key;

                return (
                  <div key={key} className="space-y-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase">{label}</h4>
                    {vals.map((v, vIdx) => (
                      <button key={v} onClick={() => {
                        setFilterMode('specific');
                        setSelectedSpecifics(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
                      }} className={`w-full text-right p-2 rounded-lg text-[10px] font-bold border transition-all ${selectedSpecifics.includes(v) ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                        {lang === 'ar' ? v : (optionsEn as any)[key]?.[vIdx] || v}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-2 border-t">
              <button onClick={() => setShowSpecificFilterModal(false)} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black shadow-xl">{lang === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}</button>
              <button onClick={() => setSelectedSpecifics([])} className="bg-slate-100 text-slate-500 p-4 rounded-2xl font-black">{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</button>
              <button onClick={() => setShowSpecificFilterModal(false)} className="bg-red-50 text-red-500 p-4 rounded-2xl font-black">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-black text-slate-800 text-right">{lang === 'ar' ? 'ملاحظات إضافية' : 'Extra Notes'}</h3>
            <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none h-48 text-right" value={showNotesModal.text} onChange={(e) => setShowNotesModal({...showNotesModal, text: e.target.value})} placeholder="..." />
            <div className="flex gap-2">
              <button onClick={() => { updateStudent(showNotesModal.id, 'notes', showNotesModal.text); setShowNotesModal(null); }} className="flex-1 bg-blue-600 text-white p-3 rounded-2xl font-black">{lang === 'ar' ? 'موافق' : 'OK'}</button>
              <button onClick={() => setShowNotesModal(null)} className="p-3 bg-slate-100 rounded-2xl font-black">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TeacherFollowUpPage: React.FC = () => {
  const { data, updateData } = useGlobal();
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [showOpenReportModal, setShowOpenReportModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('manual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeViolationModal, setActiveViolationModal] = useState<{id: string, notes: string[]} | null>(null);
  const [customFillValues, setCustomFillValues] = useState<Record<string, string>>({});

  const subjects = [
    "القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "اللغة الإنجليزية", 
    "الرياضيات", "العلوم", "الكيمياء", "الفيزياء", "الأحياء", "الاجتماعيات", 
    "الحاسوب", "المكتبة", "الفنية", "المختص الاجتماعي", "الأنشطة", "غيرها"
  ];

  const classLevels = [
    "التمهيدي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", 
    "السابع", "الثامن", "التاسع", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"
  ];

  const metrics = [
    { key: 'attendance', label: 'الحضور', color: 'bg-[#E2EFDA]' },
    { key: 'appearance', label: 'المظهر', color: 'bg-[#E2EFDA]' },
    { key: 'preparation', label: 'تحضير', color: 'bg-white' },
    { key: 'supervision_queue', label: 'طابور', color: 'bg-[#FCE4D6]' },
    { key: 'supervision_rest', label: 'راحة', color: 'bg-[#FCE4D6]' },
    { key: 'supervision_end', label: 'نهاية', color: 'bg-[#FCE4D6]' },
    { key: 'correction_notebooks', label: 'دفاتر', color: 'bg-[#DDEBF7]' },
    { key: 'correction_books', label: 'كتب', color: 'bg-[#DDEBF7]' },
    { key: 'correction_followup', label: 'متابعة تصحيح', color: 'bg-[#DDEBF7]' },
    { key: 'teaching_aids', label: 'وسائل تعليمية', color: 'bg-white' },
    { key: 'extra_activities', label: 'أنشطة لا صفية', color: 'bg-[#D9E1F2]' },
    { key: 'radio', label: 'إذاعة', color: 'bg-white' },
    { key: 'creativity', label: 'إبداع', color: 'bg-[#FCE4D6]' },
    { key: 'zero_period', label: 'حصة صفرية', color: 'bg-[#E2EFDA]' },
  ];

  const violationPresets = [
    "تأخر عن طابور",
    "تأخر عن حصة",
    "خروج من الحصة",
    "الإفراط في العقاب",
    "رفض القرارات الإدارية",
    "عدم تسليم ما كلف به"
  ];

  const activeReport = useMemo(() => {
    const found = data.dailyReports.find(r => r.id === activeReportId);
    return found || data.dailyReports[data.dailyReports.length - 1];
  }, [data.dailyReports, activeReportId]);

  useEffect(() => {
    if (activeReport && !activeReportId) {
      setActiveReportId(activeReport.id);
    }
  }, [activeReport, activeReportId]);

  const updateActiveReport = (updates: Partial<DailyReportContainer>) => {
    if (!activeReportId && !activeReport?.id) return;
    const idToUpdate = activeReportId || activeReport?.id;
    const updated = data.dailyReports.map(r => 
      r.id === idToUpdate ? { ...r, ...updates } : r
    );
    updateData({ dailyReports: updated });
  };

  const createNewReport = () => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date();
    const dayName = days[today.getDay()];
    const dateStr = today.toISOString().split('T')[0];
    let importedTeachers: TeacherFollowUp[] = [];
    if (data.dailyReports.length > 0) {
      const lastReport = data.dailyReports[data.dailyReports.length - 1];
      importedTeachers = lastReport.teachersData.map(t => ({
        ...t,
        id: Date.now().toString() + Math.random(),
        attendance: 0, appearance: 0, preparation: 0,
        supervision_queue: 0, supervision_rest: 0, supervision_end: 0,
        correction_books: 0, correction_notebooks: 0, correction_followup: 0,
        teaching_aids: 0, extra_activities: 0, radio: 0, creativity: 0, zero_period: 0,
        violations_score: 0, violations_notes: []
      }));
    }
    const newReport: DailyReportContainer = { id: Date.now().toString(), dayName, dateStr, teachersData: importedTeachers };
    updateData({ dailyReports: [...data.dailyReports, newReport] });
    setActiveReportId(newReport.id);
    setShowOpenReportModal(false);
  };

  const deleteReport = (reportId: string) => {
    if (confirm('سيتم حذف هذا التقرير وكامل بيانات المعلمين المرتبطة به. هل أنت متأكد؟')) {
      const filtered = data.dailyReports.filter(r => r.id !== reportId);
      updateData({ dailyReports: filtered });
      if (activeReportId === reportId) setActiveReportId(null);
    }
  };

  const addNewTeacher = () => {
    const targetReport = activeReport;
    if (!targetReport) return alert('يرجى إنشاء جدول أولاً');
    const newTeacher: TeacherFollowUp = {
      id: Date.now().toString(), teacherName: '', subjectCode: '', className: '',
      attendance: 0, appearance: 0, preparation: 0, supervision_queue: 0, supervision_rest: 0, supervision_end: 0,
      correction_books: 0, correction_notebooks: 0, correction_followup: 0, teaching_aids: 0, extra_activities: 0, radio: 0, creativity: 0, zero_period: 0,
      violations_score: 0, violations_notes: [], order: (targetReport.teachersData.length || 0) + 1
    };
    updateActiveReport({ teachersData: [...targetReport.teachersData, newTeacher] });
  };

  const updateCell = (teacherId: string, field: keyof TeacherFollowUp, value: any) => {
    if (!activeReport) return;
    const updatedTeachers = activeReport.teachersData.map(t => {
      if (t.id === teacherId) {
        let val = value;
        if (!['teacherName', 'subjectCode', 'className', 'violations_notes', 'order'].includes(field)) {
          const max = data.maxGrades[field as string] || 999;
          val = Math.min(Math.max(0, Number(value)), max);
        }
        return { ...t, [field]: val };
      }
      return t;
    });
    updateActiveReport({ teachersData: updatedTeachers });
  };

  const fillAllMax = () => {
    if (!activeReport || !confirm('هل أنت متأكد من تعبئة الدرجات القصوى لجميع المعلمين وفي كافة المجالات؟')) return;
    const updatedTeachers = activeReport.teachersData.map(t => {
      const filled = { ...t };
      metrics.forEach(m => {
        (filled as any)[m.key] = data.maxGrades[m.key] || 0;
      });
      return filled;
    });
    updateActiveReport({ teachersData: updatedTeachers });
  };

  const bulkUpdateMetric = (key: string, value: number) => {
    if (!activeReport) return;
    const max = data.maxGrades[key] || 999;
    const safeValue = Math.min(value, max);
    const updatedTeachers = activeReport.teachersData.map(t => ({ ...t, [key]: safeValue }));
    updateActiveReport({ teachersData: updatedTeachers });
  };

  const totalPossiblePerTeacher = useMemo(() => {
    return Object.values(data.maxGrades).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
  }, [data.maxGrades]);

  const sortedAndFilteredData = useMemo(() => {
    if (!activeReport) return [];
    let result = [...activeReport.teachersData];

    if (filterMode === 'teacher' && selectedTeacherId) {
      result = result.filter(t => t.id === selectedTeacherId);
    } else if (searchQuery) {
      result = result.filter(t => t.teacherName.includes(searchQuery));
    }
    
    if (filterMode === 'percent') {
      result.sort((a, b) => {
        const sumA = metrics.reduce((acc, m) => acc + (a[m.key as keyof TeacherFollowUp] as number || 0), 0) - (a.violations_score || 0);
        const sumB = metrics.reduce((acc, m) => acc + (b[m.key as keyof TeacherFollowUp] as number || 0), 0) - (b.violations_score || 0);
        return sumB - sumA;
      });
    } else {
      result.sort((a, b) => {
        let valA, valB;
        switch(sortCriteria) {
          case 'name': valA = a.teacherName; valB = b.teacherName; break;
          case 'subject': 
            valA = subjects.indexOf(a.subjectCode); 
            valB = subjects.indexOf(b.subjectCode);
            if (valA === -1) valA = 999;
            if (valB === -1) valB = 999;
            break;
          case 'class': valA = a.className; valB = b.className; break;
          default: valA = a.order || 0; valB = b.order || 0; break;
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [activeReport, filterMode, searchQuery, selectedTeacherId, sortCriteria, sortDirection, subjects]);

  const displayMetrics = useMemo(() => {
    if (filterMode === 'metric' && selectedMetricKeys.length > 0) {
      return metrics.filter(m => selectedMetricKeys.includes(m.key));
    }
    return metrics;
  }, [filterMode, selectedMetricKeys, metrics]);

  const isMetricFiltered = filterMode === 'metric';

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    metrics.forEach(m => {
      totals[m.key] = sortedAndFilteredData.reduce((acc, t) => acc + (Number((t as any)[m.key]) || 0), 0);
    });
    totals['violations'] = sortedAndFilteredData.reduce((acc, t) => acc + (t.violations_score || 0), 0);
    totals['grand_total'] = sortedAndFilteredData.reduce((acc, t) => {
      const sum = metrics.reduce((mAcc, m) => mAcc + (Number((t as any)[m.key]) || 0), 0) - (t.violations_score || 0);
      return acc + sum;
    }, 0);
    return totals;
  }, [sortedAndFilteredData, metrics]);

  if (!activeReport && data.dailyReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-6 animate-in fade-in duration-500">
        <div className="p-8 bg-blue-50 rounded-full"><FilePlus className="w-16 h-16 text-blue-200" /></div>
        <p className="font-black text-xl text-slate-600">لا توجد سجلات متابعة مسبقة</p>
        <button onClick={createNewReport} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">إنشاء أول تقرير</button>
      </div>
    );
  }

  const toggleViolationPreset = (preset: string) => {
    if (!activeViolationModal) return;
    const currentNotes = activeReport.teachersData.find(t => t.id === activeViolationModal.id)?.violations_notes || [];
    let newNotes;
    if (currentNotes.includes(preset)) {
      newNotes = currentNotes.filter(n => n !== preset);
    } else {
      newNotes = [...currentNotes, preset];
    }
    updateCell(activeViolationModal.id, 'violations_notes', newNotes);
  };

  return (
    <div className="space-y-4 font-arabic pb-20 animate-in fade-in duration-500">
      
      {/* Header Info */}
      {activeReport && (
        <div className="bg-white border-b-4 border-blue-600 p-5 rounded-3xl shadow-sm text-center">
           <div className="flex items-center justify-center gap-4 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-800">تقرير متابعة المعلمين ليوم:</h1>
              <input className="bg-blue-50 border-b-2 border-blue-200 px-3 py-1 text-xl md:text-2xl font-black text-blue-700 outline-none w-32 text-center rounded-lg" value={activeReport.dayName} onChange={(e) => updateActiveReport({ dayName: e.target.value })} />
              <h1 className="text-xl md:text-2xl font-black text-slate-800">بتاريخ:</h1>
              <input type="date" className="bg-blue-50 border-b-2 border-blue-200 px-3 py-1 text-xl md:text-2xl font-black text-blue-700 outline-none rounded-lg" value={activeReport.dateStr} onChange={(e) => updateActiveReport({ dateStr: e.target.value })} />
           </div>
        </div>
      )}

      {/* Advanced Toolbar */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3 relative z-[100]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${showFilterMenu ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <FilterIcon className="w-4 h-4" /> <span>نظام الفلترة المزدوج</span>
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 animate-in fade-in zoom-in duration-200 space-y-4">
                 <div className="space-y-1">
                    <button onClick={() => { setFilterMode('all'); setSelectedMetricKeys([]); setShowFilterMenu(false); }} className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center justify-between ${filterMode === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}>
                       <div className="flex items-center gap-2"><LayoutList className="w-4 h-4" /> عرض الجميع </div>
                       {filterMode === 'all' && <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setFilterMode('percent'); setShowFilterMenu(false); }} className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center justify-between ${filterMode === 'percent' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}>
                       <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> حسب النسبة </div>
                       {filterMode === 'percent' && <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setShowMetricPicker(true); setShowFilterMenu(false); }} className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center justify-between ${filterMode === 'metric' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}>
                       <div className="flex items-center gap-2"><Target className="w-4 h-4" /> تخصيص حسب المعيار </div>
                       {filterMode === 'metric' && <Check className="w-4 h-4" />}
                    </button>
                 </div>

                 <div className="pt-2 border-t">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">الفلترة حسب المعلم:</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none"
                      onChange={(e) => { setSelectedTeacherId(e.target.value); setFilterMode('teacher'); setShowFilterMenu(false); }}
                    >
                      <option value="">اختر معلماً...</option>
                      {activeReport?.teachersData.map(t => <option key={t.id} value={t.id}>{t.teacherName}</option>)}
                    </select>
                 </div>
              </div>
            )}
          </div>

          {/* Metric Multi-Picker Modal */}
          {showMetricPicker && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-black text-slate-800">اختر المعايير المراد عرضها</h3>
                  <button onClick={() => setShowMetricPicker(false)} className="text-slate-400 hover:text-slate-800"><X /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
                  {metrics.map(m => (
                    <button 
                      key={m.key} 
                      onClick={() => {
                        const newKeys = selectedMetricKeys.includes(m.key) 
                          ? selectedMetricKeys.filter(k => k !== m.key) 
                          : [...selectedMetricKeys, m.key];
                        setSelectedMetricKeys(newKeys);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-right text-xs font-bold border-2 transition-all ${selectedMetricKeys.includes(m.key) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-600'}`}
                    >
                      {selectedMetricKeys.includes(m.key) ? <Check className="w-3 h-3 shrink-0" /> : <div className="w-3 h-3" />}
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setFilterMode('metric'); setShowMetricPicker(false); }}
                    className="flex-1 bg-blue-600 text-white p-3 rounded-2xl font-black text-sm"
                  >
                    تطبيق المعايير المختارة
                  </button>
                  <button 
                    onClick={() => { setSelectedMetricKeys([]); setFilterMode('all'); setShowMetricPicker(false); }}
                    className="bg-slate-100 text-slate-500 p-3 rounded-2xl font-black text-sm px-6"
                  >
                    إعادة ضبط
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <button onClick={createNewReport} className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-green-200 hover:bg-green-100 transition-all shadow-sm">
            <FilePlus className="w-4 h-4" /> إضافة جدول
          </button>

          <button onClick={() => setShowOpenReportModal(true)} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-blue-200 hover:bg-blue-100 transition-all shadow-sm">
            <FolderOpen className="w-4 h-4" /> الأرشيف
          </button>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => setShowReorderModal(true)} className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2.5 rounded-xl font-black text-sm border border-orange-200 hover:bg-orange-100 transition-all shadow-sm"><ListOrdered className="w-4 h-4" /> الترتيب</button>
           <button onClick={addNewTeacher} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-md transform active:scale-95 transition-all"><Plus className="w-4 h-4" /> إضافة معلم</button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-center border-collapse table-fixed ${isMetricFiltered ? 'min-w-0' : 'min-w-[1300px]'}`}>
            <thead className="bg-[#FFD966] text-slate-800 sticky top-0 z-20">
              <tr className="border-b border-slate-300 h-16">
                <th rowSpan={2} className="w-8 border-e border-slate-300 text-[9px] py-1 bg-[#FFD966]">م</th>
                <th rowSpan={2} className={`${isMetricFiltered ? 'w-36' : 'w-48'} border-e border-slate-300 text-[11px] font-black bg-[#FFD966]`}>اسم المعلم</th>
                {!isMetricFiltered && (
                  <>
                    <th rowSpan={2} className="w-20 border-e border-slate-300 text-[9px] font-black bg-[#FFD966]">المادة</th>
                    <th rowSpan={2} className="w-20 border-e border-slate-300 text-[9px] font-black bg-[#FFD966]">الصف</th>
                  </>
                )}
                
                <th colSpan={displayMetrics.length} className="py-1 border-b border-slate-300 text-xs font-black bg-[#FFF2CC]">
                   <div className="flex items-center justify-center gap-3">
                      <span>مجالات تقييم المعلمين</span>
                      <button onClick={fillAllMax} className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 shadow-md transition-all flex items-center gap-1 text-[8px] px-2 py-1">
                         <Sparkles className="w-3 h-3" /> مطابقة التعبئة
                      </button>
                   </div>
                </th>

                <th rowSpan={2} className="w-14 border-s border-slate-300 bg-[#C6E0B4] text-[8px] font-black leading-tight">المخالفات</th>
                <th rowSpan={2} className="w-14 border-s border-slate-300 bg-[#C6E0B4] font-black text-[9px]">المجموع</th>
                <th rowSpan={2} className="w-14 bg-[#FFD966] font-black text-[9px] border-s border-slate-300">النسبة</th>
                <th rowSpan={2} className="w-6"></th>
              </tr>
              <tr className="bg-[#FFF2CC]">
                {displayMetrics.map(m => (
                  <th key={m.key} className={`border-e border-slate-300 ${m.color} h-[130px] ${isMetricFiltered ? 'w-16' : 'w-12'}`}>
                    <div className="flex flex-col items-center justify-between gap-1 py-1.5 h-full">
                       <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black mb-1">{m.label}</span>
                       <div className="mt-auto space-y-1 w-full px-1">
                          <input type="number" className="w-full text-[8px] text-center bg-white/70 rounded p-0.5 border border-slate-300/30 font-black outline-none" value={data.maxGrades[m.key] || 0} onChange={(e) => updateData({ maxGrades: { ...data.maxGrades, [m.key]: Number(e.target.value) } })} />
                          <button onClick={() => bulkUpdateMetric(m.key, data.maxGrades[m.key] || 0)} className="w-full py-0.5 bg-blue-50 text-blue-600 rounded text-[7px] font-black hover:bg-blue-600 hover:text-white transition-all"><Zap className="w-2 h-2 inline" /></button>
                          <div className="flex gap-0.5">
                             <input type="number" placeholder="0" className="w-2/3 text-[8px] text-center bg-white rounded p-0.5 border border-slate-200 outline-none" onChange={(e) => setCustomFillValues({...customFillValues, [m.key]: e.target.value})} />
                             <button onClick={() => bulkUpdateMetric(m.key, Number(customFillValues[m.key] || 0))} className="w-1/3 bg-green-50 text-green-600 rounded flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"><CheckCircle className="w-2 h-2" /></button>
                          </div>
                       </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFilteredData.map((teacher, index) => {
                const total = metrics.reduce((acc, m) => acc + (teacher[m.key as keyof TeacherFollowUp] as number || 0), 0) - (teacher.violations_score || 0);
                const perc = totalPossiblePerTeacher > 0 ? (total / totalPossiblePerTeacher) * 100 : 0;
                return (
                  <tr key={teacher.id} className="group hover:bg-blue-50/20 transition-colors h-9">
                    <td className="text-[9px] font-black text-slate-400 border-e border-slate-100">{teacher.order || index + 1}</td>
                    <td className="border-e border-slate-100 p-0 sticky right-0 bg-white group-hover:bg-blue-50 z-10">
                      <input className="w-full h-full px-2 bg-transparent outline-none text-right font-bold text-slate-700 text-[10px]" value={teacher.teacherName} onChange={(e) => updateCell(teacher.id, 'teacherName', e.target.value)} />
                    </td>
                    {!isMetricFiltered && (
                      <>
                        <td className="border-e border-slate-100 p-0 relative">
                          <select className="w-full h-full text-center bg-transparent outline-none text-[9px] font-bold appearance-none cursor-pointer" value={teacher.subjectCode} onChange={(e) => updateCell(teacher.id, 'subjectCode', e.target.value)}>
                            <option value="">--</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="border-e border-slate-100 p-0 relative">
                          <select className="w-full h-full text-center bg-transparent outline-none text-[9px] font-bold appearance-none cursor-pointer" value={teacher.className} onChange={(e) => updateCell(teacher.id, 'className', e.target.value)}>
                            <option value="">--</option>
                            {classLevels.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                      </>
                    )}
                    {displayMetrics.map(m => (
                      <td key={m.key} className={`border-e border-slate-100 p-0 ${m.color}/5`}>
                        <input type="number" className="w-full h-full text-center bg-transparent outline-none font-black text-[10px]" value={teacher[m.key as keyof TeacherFollowUp] || ''} onChange={(e) => updateCell(teacher.id, m.key as keyof TeacherFollowUp, e.target.value)} />
                      </td>
                    ))}
                    <td className="bg-red-50/20 border-s border-slate-100 text-red-600 font-black text-[10px] cursor-pointer" onClick={() => setActiveViolationModal({id: teacher.id, notes: teacher.violations_notes})}>-{teacher.violations_score || 0}</td>
                    <td className="bg-[#C6E0B4]/10 border-s border-slate-100 font-black text-[10px] text-slate-800">{total}</td>
                    <td className={`border-s border-slate-100 font-black text-[10px] ${perc < 50 ? 'text-red-500' : 'text-slate-800'} bg-[#FFD966]/10`}>{perc.toFixed(0)}%</td>
                    <td className="p-0 border-s border-slate-100"><button onClick={() => { if(confirm('حذف المعلم؟')) updateActiveReport({ teachersData: activeReport.teachersData.filter(t => t.id !== teacher.id) }); }} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-300 hover:text-red-600"><Trash2 className="w-3 h-3" /></button></td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer */}
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-black text-[10px]">
               <tr className="h-9 text-slate-700 bg-slate-100/50">
                  <td colSpan={isMetricFiltered ? 2 : 4} className="border-e border-slate-300 text-right px-3 text-[10px]">المجموع الكلي</td>
                  {displayMetrics.map(m => (
                    <td key={m.key} className="border-e border-slate-300 text-blue-700">{columnTotals[m.key]}</td>
                  ))}
                  <td className="border-s border-slate-300 text-red-600">{columnTotals['violations']}</td>
                  <td className="border-s border-slate-300 text-green-700 bg-green-50">{columnTotals['grand_total']}</td>
                  <td className="border-s border-slate-300 bg-[#FFD966]/20">---</td>
                  <td></td>
               </tr>
               <tr className="h-9 text-slate-700">
                  <td colSpan={isMetricFiltered ? 2 : 4} className="border-e border-slate-300 text-right px-3 text-[10px]">النسبة العامة</td>
                  {displayMetrics.map(m => {
                    const maxPossible = (data.maxGrades[m.key] || 0) * sortedAndFilteredData.length;
                    const perc = maxPossible > 0 ? (columnTotals[m.key] / maxPossible) * 100 : 0;
                    return <td key={m.key} className="border-e border-slate-300 text-slate-500">{perc.toFixed(0)}%</td>
                  })}
                  <td className="border-s border-slate-300">---</td>
                  <td className="border-s border-slate-300">---</td>
                  <td className="border-s border-slate-300 font-black bg-[#FFD966]/30 text-[10px]">
                    { (totalPossiblePerTeacher * sortedAndFilteredData.length) > 0 ? ((columnTotals['grand_total'] / (totalPossiblePerTeacher * sortedAndFilteredData.length)) * 100).toFixed(1) : 0}%
                  </td>
                  <td></td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Archive Modal */}
      {showOpenReportModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden border-4 border-white">
            <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="font-black text-xl flex items-center gap-2"><FolderOpen className="w-6 h-6" /> أرشيف التقارير اليومية</h3>
              <button onClick={()=>setShowOpenReportModal(false)} className="hover:bg-white/20 p-2 rounded-full"><X className="w-8 h-8" /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
               {data.dailyReports.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-bold">لا توجد تقارير مؤرشفة حالياً</div>
               ) : (
                 data.dailyReports.slice().reverse().map(report => (
                   <div key={report.id} className={`flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all group ${activeReportId === report.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-white bg-white hover:border-blue-200'}`}>
                      <button onClick={() => { setActiveReportId(report.id); setShowOpenReportModal(false); }} className="flex-1 text-right">
                        <div className="font-black text-slate-800 text-lg">يوم: {report.dayName}</div>
                        <div className="text-sm text-slate-500 font-bold mt-1">🗓️ {report.dateStr} | 👨‍🏫 {report.teachersData.length} معلم</div>
                      </button>
                      <button onClick={() => deleteReport(report.id)} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* Reorder Modal */}
      {showReorderModal && activeReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-4 border-orange-50">
            <div className="p-6 bg-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-xl"><ArrowUpDown className="w-6 h-6" /></div><h3 className="font-black text-xl">ترتيب وتصنيف المعلمين</h3></div>
              <button onClick={()=>setShowReorderModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <div className="p-6 bg-slate-50 border-b space-y-4">
               <div className="flex items-center justify-between"><span className="text-xs font-black text-slate-500 uppercase tracking-widest">تحديد معيار واتجاه الترتيب:</span>
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                     <button onClick={() => setSortDirection('asc')} className={`p-2 rounded-xl transition-all ${sortDirection === 'asc' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:bg-slate-50'}`}><ArrowUp className="w-4 h-4" /></button>
                     <button onClick={() => setSortDirection('desc')} className={`p-2 rounded-xl transition-all ${sortDirection === 'desc' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:bg-slate-50'}`}><ArrowDown className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {id: 'name', label: 'أبجدياً', icon: <Type className="w-4 h-4" />},
                    {id: 'subject', label: 'حسب المادة', icon: <Book className="w-4 h-4" />},
                    {id: 'class', label: 'حسب الصف', icon: <School className="w-4 h-4" />},
                    {id: 'manual', label: 'ترقيم يدوي', icon: <ListOrdered className="w-4 h-4" />},
                  ].map((btn) => (
                    <button key={btn.id} onClick={() => setSortCriteria(btn.id as SortCriteria)} className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-sm transition-all border-2 ${sortCriteria === btn.id ? 'bg-white border-orange-600 text-orange-600 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200 hover:text-slate-600'}`}>
                      {btn.icon} {btn.label}
                    </button>
                  ))}
               </div>
            </div>
            <div className="p-6 max-h-[45vh] overflow-y-auto space-y-2 bg-white">
               {activeReport.teachersData.slice().sort((a, b) => {
                    let valA, valB;
                    switch(sortCriteria) {
                      case 'name': valA = a.teacherName; valB = b.teacherName; break;
                      case 'subject': 
                        valA = subjects.indexOf(a.subjectCode); 
                        valB = subjects.indexOf(b.subjectCode);
                        if (valA === -1) valA = 999;
                        if (valB === -1) valB = 999;
                        break;
                      case 'class': valA = a.className; valB = b.className; break;
                      default: valA = a.order || 0; valB = b.order || 0; break;
                    }
                    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                 }).map((t, idx) => (
                 <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-orange-50/30 transition-colors">
                    <div className="flex-1"><div className="font-black text-slate-800 text-sm">{t.teacherName || 'معلم بدون اسم'}</div><div className="text-[10px] font-bold text-slate-400 flex gap-3 mt-1"><span>📦 {t.subjectCode || 'بدون مادة'}</span><span>🏢 {t.className || 'بدون صف'}</span></div></div>
                    {sortCriteria === 'manual' && (<div className="flex items-center gap-2"><span className="text-[10px] font-black text-orange-400">الترتيب:</span><input type="number" className="w-14 p-2 bg-white border-2 border-orange-100 rounded-xl text-center font-black text-orange-600 outline-none focus:border-orange-500 shadow-inner" value={t.order || idx + 1} onChange={(e) => updateCell(t.id, 'order', Number(e.target.value))} /></div>)}
                 </div>
               ))}
            </div>
            <div className="p-6 border-t bg-slate-50 flex gap-4"><button onClick={()=>setShowReorderModal(false)} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black text-base shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">اعتماد الترتيب المختار</button></div>
          </div>
        </div>
      )}

      {/* Violation Modal */}
      {activeViolationModal && activeReport && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border-4 border-red-50">
            <div className="p-5 bg-red-600 text-white flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2"><AlertCircle className="w-5 h-5" /> رصد مخالفة وتنبيه</h3>
              <button onClick={()=>setActiveViolationModal(null)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div className="text-center bg-red-50 p-6 rounded-3xl">
                    <label className="block text-xs font-black text-red-700 mb-2 uppercase">درجات الخصم</label>
                    <input type="number" className="w-20 p-2 bg-transparent text-4xl font-black text-center text-red-600 outline-none" value={activeReport.teachersData.find(t=>t.id===activeViolationModal.id)?.violations_score || 0} onChange={(e) => updateCell(activeViolationModal.id, 'violations_score', e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2">ملاحظات إضافية:</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-400 h-24"
                      placeholder="اكتب ملاحظة حرة هنا..."
                      value={activeReport.teachersData.find(t=>t.id===activeViolationModal.id)?.violations_notes?.filter(n => !violationPresets.includes(n)).join('\n') || ''}
                      onChange={(e) => {
                        const presets = activeReport.teachersData.find(t=>t.id===activeViolationModal.id)?.violations_notes?.filter(n => violationPresets.includes(n)) || [];
                        const freeText = e.target.value.split('\n').filter(t => t.trim() !== '');
                        updateCell(activeViolationModal.id, 'violations_notes', [...presets, ...freeText]);
                      }}
                    />
                 </div>
               </div>
               
               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 block mb-2">اختر من المخالفات الشائعة:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {violationPresets.map(preset => {
                      const isSelected = activeReport.teachersData.find(t=>t.id===activeViolationModal.id)?.violations_notes?.includes(preset);
                      return (
                        <button 
                          key={preset}
                          onClick={() => toggleViolationPreset(preset)}
                          className={`flex items-center justify-between p-3 rounded-xl text-right text-xs font-bold border-2 transition-all ${isSelected ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-slate-100 text-slate-600 hover:border-red-200'}`}
                        >
                          <span>{preset}</span>
                          {isSelected ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-200 rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
               </div>
            </div>
            <div className="p-6 border-t bg-slate-50">
               <button onClick={()=>setActiveViolationModal(null)} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg">حفظ سجل المخالفة</button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Footer */}
      <div className="flex items-center justify-between px-8 py-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl border-t-4 border-blue-500">
         <div className="flex items-center gap-12">
            <div className="flex flex-col"><span className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">إجمالي النقاط المتاحة</span><span className="text-2xl font-black">{totalPossiblePerTeacher} <span className="text-xs text-slate-500 font-normal">درجة</span></span></div>
            <div className="w-px h-10 bg-slate-700"></div>
            <div className="flex flex-col"><span className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">عدد معلمين الجدول</span><span className="text-2xl font-black">{activeReport?.teachersData.length || 0} <span className="text-xs text-slate-500 font-normal">معلم</span></span></div>
         </div>
         <div className="text-left hidden md:block">
            <p className="text-[11px] font-black text-blue-500 tracking-tighter uppercase tracking-widest"> رفيق المشرف الإداري </p>
            <p className="text-[9px] font-bold text-slate-500 italic">Prepared by Administrative Consultant Ibrahim Dukhan</p>
         </div>
      </div>
    </div>
  );
};

export const DailyReportsPage: React.FC = () => <TeacherFollowUpPage />;
export const ViolationsPage: React.FC = () => {
  const { data, updateData } = useGlobal();
  const columns = [{ key: 'date', label: 'التاريخ' }, { key: 'studentName', label: 'اسم الطالب' }, { key: 'violation', label: 'المخالفة' }, { key: 'action', label: 'الإجراء المتخذ' }];
  return (
    <div className="p-2">
      <DynamicTable 
        title="سجل التعهدات والمخالفات السلوكية" 
        columns={columns} 
        data={data.violations} 
        onAdd={() => {
          const newViolation = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], studentName: '', violation: '', action: '' };
          updateData({ violations: [...data.violations, newViolation] });
        }} 
        onEdit={(item) => {
          const studentName = prompt('اسم الطالب:', item.studentName);
          const violation = prompt('المخالفة:', item.violation);
          const action = prompt('الإجراء:', item.action);
          if (studentName !== null) {
            const updated = data.violations.map(v => v.id === item.id ? { ...v, studentName, violation, action } : v);
            updateData({ violations: updated });
          }
        }} 
        onDelete={(id) => { if (confirm('حذف؟')) updateData({ violations: data.violations.filter(v => v.id !== id) }); }} 
      />
    </div>
  );
};
