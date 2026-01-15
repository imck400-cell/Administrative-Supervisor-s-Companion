
export type Language = 'ar' | 'en';

export interface SchoolProfile {
  schoolName: string;
  supervisorName: string;
  classes: string;
  qualityOfficer: string;
  managerName: string;
  year: string;
}

export interface SubstitutionEntry {
  id: string;
  absentTeacher: string;
  replacementTeacher: string;
  period: string;
  class: string;
  date: string;
  paymentStatus: 'pending' | 'paid';
}

export interface TeacherFollowUp {
  id: string;
  teacherName: string;
  subjectCode: string;
  className: string;
  attendance: number;
  appearance: number;
  preparation: number;
  supervision_queue: number;
  supervision_rest: number;
  supervision_end: number;
  correction_books: number;
  correction_notebooks: number;
  correction_followup: number;
  teaching_aids: number;
  extra_activities: number;
  radio: number;
  creativity: number;
  zero_period: number;
  violations_score: number;
  violations_notes: string[];
  order?: number; // حقل اختياري لترتيب المعلمين
}

export interface DailyReportContainer {
  id: string;
  dayName: string;
  dateStr: string;
  teachersData: TeacherFollowUp[];
}

export interface AppData {
  profile: SchoolProfile;
  substitutions: SubstitutionEntry[];
  dailyReports: DailyReportContainer[];
  violations: any[];
  parentVisits: any[];
  teacherFollowUps: TeacherFollowUp[];
  maxGrades: Record<string, number>;
}
