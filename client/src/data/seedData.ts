import type { StudentData } from '@/types'

// ---------------------------------------------------------------------------
// DEMO seed — illustrative only. The student can edit everything; changes are
// persisted locally in the browser (see StudentDataContext). No cloud database.
// `activities` are generated at runtime so the streak looks current.
// ---------------------------------------------------------------------------
export const seedStudentData: Omit<StudentData, 'activities'> = {
  profile: {
    id: 'demo-student',
    displayName: 'Aarav Sharma',
    branch: 'Computer Science & Engineering',
    year: '2nd Year (Semester 3)',
    college: 'Demo Institute of Technology',
    cgpa: 0, // computed live from records in the UI; kept for type compatibility
    academicInterests: ['Algorithms', 'Machine Learning', 'Web Development'],
    careerInterests: ['Software Engineer', 'Data Scientist'],
    currentGoal: 'Secure a summer internship in software development',
    preferredLearning: 'Hands-on projects with short videos',
  },
  records: [
    { id: 'seed-r1', semester: 1, subject: 'Mathematics I', marks: 78, grade: 'B+' },
    { id: 'seed-r2', semester: 1, subject: 'Physics I', marks: 75, grade: 'B+' },
    { id: 'seed-r3', semester: 1, subject: 'Chemistry I', marks: 72, grade: 'B' },
    { id: 'seed-r4', semester: 1, subject: 'Programming Fundamentals', marks: 85, grade: 'A' },
    { id: 'seed-r5', semester: 2, subject: 'Mathematics II', marks: 80, grade: 'A-' },
    { id: 'seed-r6', semester: 2, subject: 'Physics II', marks: 77, grade: 'B+' },
    { id: 'seed-r7', semester: 2, subject: 'Data Structures', marks: 86, grade: 'A' },
    { id: 'seed-r8', semester: 2, subject: 'OOP', marks: 83, grade: 'A-' },
    { id: 'seed-r9', semester: 3, subject: 'Data Structures', marks: 88, grade: 'A' },
    { id: 'seed-r10', semester: 3, subject: 'Operating Systems', marks: 82, grade: 'A-' },
    { id: 'seed-r11', semester: 3, subject: 'Mathematics III', marks: 71, grade: 'B' },
    { id: 'seed-r12', semester: 3, subject: 'DBMS', marks: 90, grade: 'A+' },
    { id: 'seed-r13', semester: 3, subject: 'Digital Logic', marks: 76, grade: 'B+' },
  ],
  goals: [
    {
      id: 'seed-g1',
      title: 'Complete DSA practice set (150 problems)',
      category: 'programming',
      status: 'in_progress',
      progress: 60,
      deadline: '2026-12-15',
      shared: true,
    },
    {
      id: 'seed-g2',
      title: 'Build a full-stack project for portfolio',
      category: 'project',
      status: 'in_progress',
      progress: 35,
      deadline: '2026-11-30',
      shared: true,
    },
    {
      id: 'seed-g3',
      title: 'Complete a Machine Learning certification',
      category: 'certification',
      status: 'not_started',
      progress: 0,
      deadline: '2027-02-28',
      shared: true,
    },
    {
      id: 'seed-g4',
      title: 'Prepare resume for internship season',
      category: 'internship',
      status: 'in_progress',
      progress: 50,
      deadline: '2026-11-10',
      shared: false,
    },
  ],
  tasks: [
    { id: 'seed-t1', title: 'DSA practice (arrays)', subject: 'Data Structures', day: 'Mon', priority: 'high', completed: false, due: '2026-10-20' },
    { id: 'seed-t2', title: 'DBMS lab exercises', subject: 'DBMS', day: 'Tue', priority: 'medium', completed: false, due: '2026-10-21' },
    { id: 'seed-t3', title: 'Mathematics III revision', subject: 'Mathematics III', day: 'Wed', priority: 'high', completed: false, due: '2026-10-22' },
    { id: 'seed-t4', title: 'Project milestone work', subject: 'Project', day: 'Thu', priority: 'medium', completed: false, due: '2026-10-25' },
    { id: 'seed-t5', title: 'OS reading', subject: 'Operating Systems', day: 'Fri', priority: 'low', completed: false },
  ],
  achievements: [
    { id: 'seed-a1', title: 'Winner — Demo Hackathon 2026', date: '2026-09-12', type: 'award' },
    { id: 'seed-a2', title: 'Completed Web Development bootcamp', date: '2026-08-20', type: 'certification' },
    { id: 'seed-a3', title: 'Built college event registration app', date: '2026-07-30', type: 'project' },
  ],
}
