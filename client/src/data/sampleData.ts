import type { DemoParentData, DemoStudentData } from '@/types'

// ---------------------------------------------------------------------------
// DEMO DATA — clearly labelled.
// This is illustrative sample data so the dashboards are populated during the
// guided demo. It is NOT real student records. In Milestone 2 this is replaced
// by data read from the authenticated student's Supabase profile.
// ---------------------------------------------------------------------------

export const demoStudent: DemoStudentData = {
  profile: {
    id: 'demo-student',
    displayName: 'Aarav Sharma',
    branch: 'Computer Science & Engineering',
    year: '2nd Year (Semester 3)',
    college: 'Demo Institute of Technology',
    cgpa: 8.4,
    academicInterests: ['Algorithms', 'Machine Learning', 'Web Development'],
    careerInterests: ['Software Engineer', 'Data Scientist'],
    currentGoal: 'Secure a summer internship in software development',
    preferredLearning: 'Hands-on projects with short videos',
  },
  semesterGpas: [
    { semester: 1, sgpa: 7.8 },
    { semester: 2, sgpa: 8.1 },
    { semester: 3, sgpa: 8.4 },
  ],
  records: [
    { id: 'r1', semester: 3, subject: 'Data Structures', marks: 88, grade: 'A' },
    { id: 'r2', semester: 3, subject: 'Operating Systems', marks: 82, grade: 'A' },
    { id: 'r3', semester: 3, subject: 'Mathematics III', marks: 71, grade: 'B' },
    { id: 'r4', semester: 3, subject: 'DBMS', marks: 90, grade: 'A+' },
    { id: 'r5', semester: 3, subject: 'Digital Logic', marks: 76, grade: 'B+' },
  ],
  subjectPerformance: [
    { subject: 'DBMS', averageMarks: 90, trend: 'up' },
    { subject: 'Data Structures', averageMarks: 88, trend: 'up' },
    { subject: 'Operating Systems', averageMarks: 82, trend: 'stable' },
    { subject: 'Digital Logic', averageMarks: 76, trend: 'stable' },
    { subject: 'Mathematics III', averageMarks: 71, trend: 'down' },
  ],
  goals: [
    {
      id: 'g1',
      title: 'Complete DSA practice set (150 problems)',
      category: 'programming',
      status: 'in_progress',
      progress: 60,
      deadline: '2026-12-15',
      shared: true,
    },
    {
      id: 'g2',
      title: 'Build a full-stack project for portfolio',
      category: 'project',
      status: 'in_progress',
      progress: 35,
      deadline: '2026-11-30',
      shared: true,
    },
    {
      id: 'g3',
      title: 'Complete a Machine Learning certification',
      category: 'certification',
      status: 'not_started',
      progress: 0,
      deadline: '2027-02-28',
      shared: true,
    },
    {
      id: 'g4',
      title: 'Prepare resume for internship season',
      category: 'internship',
      status: 'in_progress',
      progress: 50,
      deadline: '2026-11-10',
      shared: false,
    },
  ],
  achievements: [
    { id: 'a1', title: 'Winner — Demo Hackathon 2026', date: '2026-09-12', type: 'award' },
    { id: 'a2', title: 'Completed Web Development bootcamp', date: '2026-08-20', type: 'certification' },
    { id: 'a3', title: 'Built college event registration app', date: '2026-07-30', type: 'project' },
  ],
  upcoming: [
    { id: 'u1', title: 'DBMS mid-semester exam', type: 'exam', due: '2026-10-22', priority: 'high' },
    { id: 'u2', title: 'Project milestone 2 review', type: 'deadline', due: '2026-10-25', priority: 'high' },
    { id: 'u3', title: 'Coding practice session', type: 'session', due: '2026-10-19', priority: 'medium' },
    { id: 'u4', title: 'Math assignment submission', type: 'assignment', due: '2026-10-28', priority: 'medium' },
  ],
  strengths: ['DBMS', 'Data Structures', 'Web Development projects'],
  improvementAreas: ['Mathematics III', 'Consistent daily practice'],
  recommendedNextAction:
    'Focus this week on DBMS exam prep (22 Oct) while keeping the project on track for its 25 Oct milestone.',
  learningStreakDays: 12,
  readinessScore: 68,
}

export const demoParent: DemoParentData = {
  studentName: 'Aarav Sharma',
  academicSummary:
    "Aarav is in his 2nd year of Computer Science. His CGPA has risen from 7.8 to 8.4 over three semesters — a clear upward trend. He is strongest in DBMS and Data Structures, and is currently working to improve in Mathematics.",
  sharedGoals: demoStudent.goals.filter((g) => g.shared),
  recentAchievements: demoStudent.achievements,
  supportSuggestions: [
    {
      id: 's1',
      title: 'Encourage a fixed daily study slot',
      detail:
        'A consistent 2-hour evening slot helped him build a 12-day learning streak. Protecting that time supports his progress.',
    },
    {
      id: 's2',
      title: 'Discuss the internship goal together',
      detail:
        'He aims to land a summer software internship. Talking through options early reduces last-minute pressure.',
    },
    {
      id: 's3',
      title: 'Celebrate the upward CGPA trend',
      detail: 'Recognising improvement, not just final scores, keeps motivation healthy.',
    },
  ],
  actionPlan: [
    { id: 'ap1', title: 'Finalise internship shortlist by 10 Nov', owner: 'student', status: 'pending' },
    { id: 'ap2', title: 'Review family budget for certification fee', owner: 'family', status: 'pending' },
    { id: 'ap3', title: 'Schedule a 20-minute weekly progress chat', owner: 'family', status: 'done' },
  ],
}
