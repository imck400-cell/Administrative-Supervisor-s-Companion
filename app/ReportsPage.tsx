
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

// Fix: Adding missing export DailyReportsPage to resolve App.tsx error
export const DailyReportsPage: React.FC = () => {
  const { lang } = useGlobal();
  return (
    <div className="p-8 text-center bg-white rounded-2xl border">
      <h2 className="text-xl font-bold">{lang === 'ar' ? 'سجل متابعة المعلمين' : 'Teachers Follow-up Log'}</h2>
      <p className="text-slate-500 mt-2">{lang === 'ar' ? 'قيد التطوير...' : 'Under development...'}</p>
    </div>
  );
};

// Fix: Adding missing export ViolationsPage to resolve App.tsx error
export const ViolationsPage: React.FC = () => {
  const { lang } = useGlobal();
  return (
    <div className="p-8 text-center bg-white rounded-2xl border">
      <h2 className="text-xl font-bold">{lang === 'ar' ? 'سجل التعهدات والمخالفات' : 'Violations & Pledges Log'}</h2>
      <p className="text-slate-500 mt-2">{lang === 'ar' ? 'قيد التطوير...' : 'Under development...'}</p>
    </div>
  );
};

export const StudentsReportsPage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterValue, setFilterValue] = useState('');
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
  const [studentInput, setStudentInput] = useState('');
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
    // Strict Filtering for 'student' mode: show ONLY matches, and EMPTY if no names selected
    if (filterMode === 'student') {
      if (selectedStudentNames.length === 0) return [];
      result = result.filter(s => selectedStudentNames.some(name => s.name.toLowerCase().includes(name.toLowerCase())));
    }
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
  }, [studentData, filterMode, filterValue, selectedSpecifics, selectedStudentNames]);

  // Suggestions for student input
  const suggestions = useMemo(() => {
    if (!studentInput.trim()) return [];
    return studentData
      .filter(s => s.name.toLowerCase().includes(studentInput.toLowerCase()))
      .map(s => s.name)
      .filter((name, idx, self) => self.indexOf(name) === idx && !selectedStudentNames.includes(name));
  }, [studentInput, studentData, selectedStudentNames]);

  // Determine if we are in "Metric Only" view
  const isOnlyMetricView = filterMode === 'metric' && activeMetricFilter.length > 0;

  const addStudentToFilter = (name?: string) => {
    const targetName = name || studentInput.trim();
    if (targetName && !selectedStudentNames.includes(targetName)) {
      setSelectedStudentNames(prev => [...prev, targetName]);
      setStudentInput('');
    }
  };

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
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-[85vw] sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[100] animate-in fade-in zoom-in duration-200 space-y-4 text-right">
                 <button onClick={() => setFilterMode('all')} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'الجميع' : 'All'} {filterMode === 'all' && <Check className="w-4 h-4"/>}</button>
                 
                 <div className="border rounded-xl p-2 bg-slate-50">
                   <button onClick={() => setFilterMode('student')} className="w-full text-right p-2 rounded-lg font-bold text-sm hover:bg-white flex items-center justify-between">{lang === 'ar' ? 'حسب الطالب' : 'By Student'} {filterMode === 'student' && <Check className="w-4 h-4"/>}</button>
                   {filterMode === 'student' && (
                     <div className="mt-2 space-y-2 relative">
                        <div className="flex gap-1">
                          <input 
                            type="text" 
                            className="flex-1 text-[10px] p-2 rounded border outline-none" 
                            placeholder={lang === 'ar' ? 'اسم الطالب...' : 'Name...'}
                            value={studentInput}
                            onChange={(e) => setStudentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addStudentToFilter()}
                          />
                          <button onClick={() => addStudentToFilter()} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={14}/></button>
                        </div>
                        {suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                            {suggestions.map((name, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => addStudentToFilter(name)}
                                className="w-full text-right p-2 text-[10px] font-bold hover:bg-blue-50 border-b border-slate-50 last:border-none"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {selectedStudentNames.map(name => (
                            <span key={name} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                              {name} <X size={10} className="cursor-pointer" onClick={() => setSelectedStudentNames(prev => prev.filter(n => n !== name))} />
                            </span>
                          ))}
                        </div>
                     </div>
                   )}
                 </div>

                 <button onClick={() => setMetricFilterMode(true)} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'حسب المعيار' : 'By Metric'} {isOnlyMetricView && <Check className="w-4 h-4"/>}</button>
                 <button onClick={() => setShowSpecificFilterModal(true)} className="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-between">{lang === 'ar' ? 'حسب صفة معينة' : 'By Feature'} {filterMode === 'specific' && <Check className="w-4 h-4"/>}</button>

                 <div className="pt-2 border-t">
                    <button 
                      onClick={() => setShowFilterModal(false)}
                      className="w-full bg-blue-600 text-white p-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                      {lang === 'ar' ? 'تطبيق' : 'Apply'}
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-center border-collapse table-auto ${isOnlyMetricView ? 'min-w-[700px]' : 'min-w-[1600px]'}`}>
            <thead className="bg-[#FFD966] text-slate-800 sticky top-0 z-20">
              <tr className="border-b border-slate-300 h-12">
                <th rowSpan={2} className="px-3 border-e border-slate-300 w-[140px] text-xs font-black sticky right-0 bg-[#FFD966] z-30">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                <th rowSpan={2} className="px-1 border-e border-slate-300 w-20 text-xs font-black">{lang === 'ar' ? 'الصف' : 'Grade'}</th>
                <th rowSpan={2} className="px-1 border-e border-slate-300 w-16 text-xs font-black">{lang === 'ar' ? 'الشعبة' : 'Section'}</th>
                
                {!isOnlyMetricView && (
                  <>
                    <th rowSpan={2} className="px-1 border-e border-slate-300 w-16 text-xs font-black">{lang === 'ar' ? 'النوع' : 'Gender'}</th>
                    <th rowSpan={2} className="px-2 border-e border-slate-300 w-24 text-xs font-black">{lang === 'ar' ? 'السكن / العمل' : 'Residence / Work'}</th>
                    <th rowSpan={2} className="px-2 border-e border-slate-300 w-24 text-xs font-black">{lang === 'ar' ? 'الحالة الصحية' : 'Health Status'}</th>
                    <th rowSpan={2} className="px-2 border-e border-slate-300 w-32 text-xs font-black">{lang === 'ar' ? 'ولي الأمر (الاسم/الهواتف)' : 'Guardian (Name/Phones)'}</th>
                    <th colSpan={3} className="px-1 border-e border-slate-300 bg-[#FFF2CC] text-xs font-black">{lang === 'ar' ? 'المستوى العلمي' : 'Academic Level'}</th>
                    <th rowSpan={2} className="px-2 border-e border-slate-300 w-24 text-xs font-black">{lang === 'ar' ? 'المستوى السلوكي' : 'Behavior Level'}</th>
                    <th rowSpan={2} className="px-2 border-e border-slate-300 w-44 text-xs font-black">{lang === 'ar' ? 'الملاحظات الأساسية' : 'Main Notes'}</th>
                    <th colSpan={3} className="px-1 border-e border-slate-300 bg-[#DDEBF7] text-xs font-black">{lang === 'ar' ? 'ولي الأمر المتابع' : 'Guardian Follow-up'}</th>
                    <th rowSpan={2} className="px-2 w-10 text-xs font-black">{lang === 'ar' ? 'ملاحظات أخرى' : 'Other Notes'}</th>
                  </>
                )}
                
                {isOnlyMetricView && activeMetricFilter.map(mKey => (
                  <th key={mKey} className="px-4 border-e border-slate-300 text-xs font-black">{metricLabels[mKey]}</th>
                ))}
              </tr>
              
              {!isOnlyMetricView && (
                <tr className="bg-[#F2F2F2] text-[9px] h-8">
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
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isOnlyMetricView ? 3 + activeMetricFilter.length : 15} className="py-10 text-slate-400 italic text-sm">
                    {filterMode === 'student' && selectedStudentNames.length === 0 
                      ? (lang === 'ar' ? 'يرجى إضافة أسماء الطلاب في الفلترة للعرض' : 'Please add student names in filter to display')
                      : (lang === 'ar' ? 'لا توجد بيانات تطابق هذا البحث' : 'No data matching this search')}
                  </td>
                </tr>
              ) : (
                filteredData.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-blue-50/20 transition-colors h-10 group">
                    <td className="p-1 border-e border-slate-100 sticky right-0 bg-white z-10 group-hover:bg-blue-50 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <input className="w-full bg-transparent border-none outline-none font-bold text-[10px] text-right" value={s.name} onChange={(e) => updateStudent(s.id, 'name', e.target.value)} />
                    </td>
                    <td className="p-1 border-e border-slate-100">
                      <select className="bg-transparent font-bold text-[9px] outline-none w-full appearance-none text-center" value={s.grade} onChange={(e) => updateStudent(s.id, 'grade', e.target.value)}>
                        {optionsAr.grades.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.grades[optionsAr.grades.indexOf(o)]}</option>)}
                      </select>
                    </td>
                    <td className="p-1 border-e border-slate-100">
                      <select className="bg-transparent font-bold text-[9px] outline-none w-full appearance-none text-center" value={s.section} onChange={(e) => updateStudent(s.id, 'section', e.target.value)}>
                        {optionsAr.sections.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.sections[optionsAr.sections.indexOf(o)]}</option>)}
                      </select>
                    </td>

                    {!isOnlyMetricView && (
                      <>
                        <td className="p-1 border-e border-slate-100">
                          <select className="bg-transparent font-bold text-[9px] outline-none w-full appearance-none text-center" value={s.gender} onChange={(e) => updateStudent(s.id, 'gender', e.target.value)}>
                            {optionsAr.gender.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.gender[optionsAr.gender.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <input className="w-full text-[9px] text-right bg-transparent outline-none" value={s.address} onChange={(e) => updateStudent(s.id, 'address', e.target.value)} placeholder="..." />
                            <select className="text-[8px] bg-slate-50/50 appearance-none text-center" value={s.workOutside} onChange={(e) => updateStudent(s.id, 'workOutside', e.target.value)}>
                              {optionsAr.workOutside.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.workOutside[optionsAr.workOutside.indexOf(o)]}</option>)}
                            </select>
                          </div>
                        </td>
                        <td className="p-1 border-e border-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <select className="text-[9px] font-bold appearance-none text-center outline-none bg-transparent" value={s.healthStatus} onChange={(e) => updateStudent(s.id, 'healthStatus', e.target.value)}>
                              {optionsAr.health.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.health[optionsAr.health.indexOf(o)]}</option>)}
                            </select>
                            {s.healthStatus === 'مريض' && <input className="text-[8px] text-center border-b outline-none" value={s.healthDetails} onChange={(e) => updateStudent(s.id, 'healthDetails', e.target.value)} />}
                          </div>
                        </td>
                        <td className="p-1 border-e border-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <input className="text-[9px] font-bold text-right outline-none bg-transparent" value={s.guardianName} onChange={(e) => updateStudent(s.id, 'guardianName', e.target.value)} />
                            {s.guardianPhones.map((p, i) => (
                              <div key={i} className="flex gap-0.5 items-center">
                                <input className="text-[8px] w-full text-center bg-slate-50/50 outline-none" value={p} onChange={(e) => {
                                  const newP = [...s.guardianPhones]; newP[i] = e.target.value; updateStudent(s.id, 'guardianPhones', newP);
                                }} />
                                {i === s.guardianPhones.length - 1 && <button onClick={() => updateStudent(s.id, 'guardianPhones', [...s.guardianPhones, ''])} className="text-blue-500 hover:scale-110"><Plus size={10}/></button>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-1 border-e border-slate-100 bg-[#FFF2CC]/5">
                          <select className="text-[9px] w-full appearance-none text-center outline-none bg-transparent" value={s.academicReading} onChange={(e) => updateStudent(s.id, 'academicReading', e.target.value)}>
                            {optionsAr.level.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.level[optionsAr.level.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100 bg-[#FFF2CC]/5">
                          <select className="text-[9px] w-full appearance-none text-center outline-none bg-transparent" value={s.academicWriting} onChange={(e) => updateStudent(s.id, 'academicWriting', e.target.value)}>
                            {optionsAr.level.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.level[optionsAr.level.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100 bg-[#FFF2CC]/5">
                          <select className="text-[9px] w-full appearance-none text-center outline-none bg-transparent" value={s.academicParticipation} onChange={(e) => updateStudent(s.id, 'academicParticipation', e.target.value)}>
                            {optionsAr.level.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.level[optionsAr.level.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100">
                          <select className="text-[9px] font-bold w-full appearance-none text-center outline-none bg-transparent" value={s.behaviorLevel} onChange={(e) => updateStudent(s.id, 'behaviorLevel', e.target.value)}>
                            {optionsAr.behavior.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.behavior[optionsAr.behavior.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100">
                          <div className="flex flex-wrap gap-0.5 justify-center max-w-[180px]">
                            {optionsAr.mainNotes.map((n, nIdx) => (
                              <button key={n} onClick={() => {
                                const newN = s.mainNotes.includes(n) ? s.mainNotes.filter(x => x !== n) : [...s.mainNotes, n];
                                updateStudent(s.id, 'mainNotes', newN);
                              }} className={`text-[7px] px-1 py-0.5 rounded border leading-none ${s.mainNotes.includes(n) ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                {lang === 'ar' ? n : optionsEn.mainNotes[nIdx]}
                              </button>
                            ))}
                            <input className="text-[8px] border-b w-full mt-0.5 text-center outline-none" value={s.otherNotesText} onChange={(e) => updateStudent(s.id, 'otherNotesText', e.target.value)} />
                          </div>
                        </td>
                        <td className="p-1 border-e border-slate-100 bg-[#DDEBF7]/5">
                          <select className="text-[8px] w-full appearance-none text-center outline-none bg-transparent" value={s.guardianEducation} onChange={(e) => updateStudent(s.id, 'guardianEducation', e.target.value)}>
                            {optionsAr.eduStatus.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.eduStatus[optionsAr.eduStatus.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100 bg-[#DDEBF7]/5">
                          <select className="text-[8px] w-full appearance-none text-center outline-none bg-transparent" value={s.guardianFollowUp} onChange={(e) => updateStudent(s.id, 'guardianFollowUp', e.target.value)}>
                            {optionsAr.followUp.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.followUp[optionsAr.followUp.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-e border-slate-100 bg-[#DDEBF7]/5">
                          <select className="text-[8px] w-full appearance-none text-center outline-none bg-transparent" value={s.guardianCooperation} onChange={(e) => updateStudent(s.id, 'guardianCooperation', e.target.value)}>
                            {optionsAr.cooperation.map(o => <option key={o} value={o}>{lang === 'ar' ? o : optionsEn.cooperation[optionsAr.cooperation.indexOf(o)]}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <button onClick={() => setShowNotesModal({id: s.id, text: s.notes})} className="p-1.5 bg-slate-100 hover:bg-blue-100 rounded-lg transition-all">
                            {s.notes ? <CheckCircle size={14} className="text-green-500" /> : <Settings2 size={14} className="text-slate-400" />}
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
                        <td key={mKey} className="p-1 border-e border-slate-100 bg-blue-50/5">
                          {possibleOpts.length > 0 ? (
                            <select 
                              className="text-[10px] w-full bg-transparent font-bold outline-none appearance-none text-center" 
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metric Filter Modal */}
      {metricFilterMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-black text-slate-800 text-right">{lang === 'ar' ? 'اختر المعايير المراد عرضها' : 'Choose Metrics to Show'}</h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[60vh] p-1">
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between border-b pb-2 mb-4">
              <h3 className="font-black">{lang === 'ar' ? 'فلترة حسب صفة معينة' : 'Filter by Specific Feature'}</h3>
              <button onClick={() => setShowSpecificFilterModal(false)} className="hover:bg-slate-100 p-1 rounded-full transition-colors"><X/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-right">
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
                    <div className="flex flex-wrap gap-1">
                      {vals.map((v, vIdx) => (
                        <button key={v} onClick={() => {
                          setFilterMode('specific');
                          setSelectedSpecifics(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
                        }} className={`text-right px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${selectedSpecifics.includes(v) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                          {lang === 'ar' ? v : (optionsEn as any)[key]?.[vIdx] || v}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-6 sticky bottom-0 bg-white pt-2 border-t">
              <button onClick={() => setShowSpecificFilterModal(false)} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black shadow-xl">{lang === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}</button>
              <button onClick={() => setSelectedSpecifics([])} className="bg-slate-100 text-slate-500 p-4 rounded-2xl font-black">{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</button>
              <button onClick={() => setShowSpecificFilterModal(false)} className="bg-red-50 text-red-500 p-4 rounded-2xl font-black">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
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
