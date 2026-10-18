// Static, descriptive engineering-branch metadata for the Course Advisor.
// These are *descriptive* facts (skills, subjects, career paths), NOT fabricated
// statistics. No cutoffs, fees, placements, or admission chances are invented.

export type Proficiency = 'strong' | 'average' | 'weak' | 'unknown'
export type CollegeType = 'government' | 'private' | 'either'

export interface BranchInfo {
  id: string
  name: string
  short: string
  description: string
  interestTags: string[]
  subjectTags: string[]
  keySkills: string[]
  subjectsStudied: string[]
  careerPaths: string[]
  roles: string[]
  pros: string[]
  cons: string[]
}

export interface CourseAssessment {
  favouriteSubjects: string[]
  interests: string[]
  strengths: string[]
  careerGoals: string[]
  preferredBranches: string[]
  mathPerformance: Proficiency
  physicsPerformance: Proficiency
  chemistryPerformance: Proficiency
  entranceExamName: string
  entranceScore: string
  examYear: string
  annualTuitionBudget: string
  totalBudget: string
  preferredLocation: string
  collegeType: CollegeType
  hostelPreferred: boolean
  willingToRelocate: boolean
}

export const emptyAssessment: CourseAssessment = {
  favouriteSubjects: [],
  interests: [],
  strengths: [],
  careerGoals: [],
  preferredBranches: [],
  mathPerformance: 'unknown',
  physicsPerformance: 'unknown',
  chemistryPerformance: 'unknown',
  entranceExamName: '',
  entranceScore: '',
  examYear: '',
  annualTuitionBudget: '',
  totalBudget: '',
  preferredLocation: '',
  collegeType: 'either',
  hostelPreferred: false,
  willingToRelocate: true,
}

export const interestOptions: { value: string; labelKey: string }[] = [
  { value: 'programming', labelKey: 'interest.programming' },
  { value: 'ai-data', labelKey: 'interest.ai-data' },
  { value: 'electronics', labelKey: 'interest.electronics' },
  { value: 'machines', labelKey: 'interest.machines' },
  { value: 'civil', labelKey: 'interest.civil' },
  { value: 'research', labelKey: 'interest.research' },
  { value: 'management', labelKey: 'interest.management' },
  { value: 'creativity', labelKey: 'interest.creativity' },
]

export const subjectOptions: string[] = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Biology',
  'English',
  'Social Studies',
]

export const careerGoalOptions: string[] = [
  'Software Development',
  'Data & AI',
  'Research',
  'Design',
  'Management',
  'Core Engineering',
  'Public Sector',
  'Entrepreneurship',
]

export const branches: BranchInfo[] = [
  {
    id: 'cse',
    name: 'Computer Science & Engineering',
    short: 'CSE',
    description: 'Software, algorithms, systems and computing foundations.',
    interestTags: ['programming', 'ai-data', 'research'],
    subjectTags: ['Mathematics', 'Computer Science'],
    keySkills: ['Data Structures', 'Algorithms', 'Programming', 'Problem-solving'],
    subjectsStudied: ['Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks'],
    careerPaths: ['Software Development', 'Data & AI', 'Research', 'Entrepreneurship'],
    roles: ['Software Engineer', 'Full-stack Developer', 'Systems Engineer'],
    pros: ['High demand across industries', 'Strong remote and entrepreneurship potential', 'Versatile skill set'],
    cons: ['Competitive and fast-changing', 'Can be theory-heavy'],
  },
  {
    id: 'aiml',
    name: 'Artificial Intelligence & Machine Learning',
    short: 'AI/ML',
    description: 'Machine learning, deep learning and intelligent systems.',
    interestTags: ['ai-data', 'programming', 'research'],
    subjectTags: ['Mathematics', 'Computer Science'],
    keySkills: ['Linear Algebra', 'Probability', 'Python', 'ML frameworks'],
    subjectsStudied: ['Machine Learning', 'Deep Learning', 'Statistics', 'NLP'],
    careerPaths: ['Data & AI', 'Research'],
    roles: ['ML Engineer', 'Data Scientist', 'Research Engineer'],
    pros: ['Fast-growing field', 'High research and product impact', 'Strong salaries'],
    cons: ['Requires strong mathematics', 'Rapidly evolving tooling'],
  },
  {
    id: 'ds',
    name: 'Data Science',
    short: 'DS',
    description: 'Data analysis, statistics and data-driven decision making.',
    interestTags: ['ai-data', 'programming', 'research'],
    subjectTags: ['Mathematics', 'Computer Science'],
    keySkills: ['Statistics', 'Python', 'SQL', 'Data Visualization'],
    subjectsStudied: ['Statistics', 'Data Mining', 'Big Data', 'Visualization'],
    careerPaths: ['Data & AI', 'Research'],
    roles: ['Data Scientist', 'Data Analyst', 'BI Engineer'],
    pros: ['Applied across every industry', 'Clear, measurable impact', 'Growing demand'],
    cons: ['Needs comfort with statistics', 'Results depend on data quality'],
  },
  {
    id: 'it',
    name: 'Information Technology',
    short: 'IT',
    description: 'IT infrastructure, applications and enterprise systems.',
    interestTags: ['programming', 'management'],
    subjectTags: ['Computer Science', 'Mathematics'],
    keySkills: ['Networking', 'Databases', 'Cloud', 'Scripting'],
    subjectsStudied: ['Networks', 'Cloud Computing', 'Web Technologies', 'IT Systems'],
    careerPaths: ['Software Development', 'Management'],
    roles: ['IT Analyst', 'DevOps Engineer', 'Systems Administrator'],
    pros: ['Broad applicability', 'Good management pathway', 'Stable demand'],
    cons: ['Less specialized than CSE', 'Some roles are operational'],
  },
  {
    id: 'ece',
    name: 'Electronics & Communication Engineering',
    short: 'ECE',
    description: 'Electronics, signals, communication and embedded systems.',
    interestTags: ['electronics', 'programming', 'research'],
    subjectTags: ['Physics', 'Mathematics'],
    keySkills: ['Circuits', 'Signal Processing', 'Microcontrollers', 'Communication'],
    subjectsStudied: ['Digital Electronics', 'Signals & Systems', 'Microprocessors', 'Communications'],
    careerPaths: ['Core Engineering', 'Software Development', 'Research'],
    roles: ['Electronics Engineer', 'Embedded Engineer', 'RF Engineer'],
    pros: ['Mix of hardware and software careers', 'Strong in telecom and IoT', 'Research opportunities'],
    cons: ['Hardware labs need resources', 'Steep initial learning curve'],
  },
  {
    id: 'eee',
    name: 'Electrical & Electronics Engineering',
    short: 'EEE',
    description: 'Power systems, machines, controls and electrical energy.',
    interestTags: ['electronics', 'machines'],
    subjectTags: ['Physics', 'Mathematics'],
    keySkills: ['Circuit Theory', 'Power Systems', 'Machines', 'Control Systems'],
    subjectsStudied: ['Electrical Machines', 'Power Systems', 'Control Systems', 'Measurements'],
    careerPaths: ['Core Engineering', 'Public Sector'],
    roles: ['Electrical Engineer', 'Power Engineer', 'Control Engineer'],
    pros: ['Core industry and public-sector roles', 'Stable core field', 'Energy-sector relevance'],
    cons: ['Can be hardware-intensive', 'Some roles location-dependent'],
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    short: 'Mech',
    description: 'Design, manufacturing, machines and thermal systems.',
    interestTags: ['machines', 'management', 'creativity'],
    subjectTags: ['Physics', 'Mathematics'],
    keySkills: ['Mechanics', 'Thermodynamics', 'CAD', 'Manufacturing'],
    subjectsStudied: ['Mechanics of Solids', 'Thermodynamics', 'Machine Design', 'Manufacturing'],
    careerPaths: ['Core Engineering', 'Management', 'Design'],
    roles: ['Mechanical Engineer', 'Design Engineer', 'Manufacturing Engineer'],
    pros: ['Broad core field', 'Strong design and management paths', 'Tangible, physical work'],
    cons: ['Some roles are field/shop-floor based', 'Slower digital shift'],
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    short: 'Civil',
    description: 'Construction, structures, infrastructure and project delivery.',
    interestTags: ['civil', 'management'],
    subjectTags: ['Physics', 'Mathematics'],
    keySkills: ['Structural Analysis', 'Surveying', 'Materials', 'Project Management'],
    subjectsStudied: ['Structural Analysis', 'Geotechnics', 'Surveying', 'Transportation'],
    careerPaths: ['Core Engineering', 'Public Sector', 'Management'],
    roles: ['Civil Engineer', 'Site Engineer', 'Structural Engineer'],
    pros: ['Essential infrastructure demand', 'Public-sector and consulting roles', 'Visible, lasting work'],
    cons: ['Site-based early career', 'Project timelines are long'],
  },
  {
    id: 'chem',
    name: 'Chemical Engineering',
    short: 'Chem',
    description: 'Process engineering, materials and chemical systems.',
    interestTags: ['research', 'machines'],
    subjectTags: ['Chemistry', 'Mathematics'],
    keySkills: ['Thermodynamics', 'Heat Transfer', 'Reaction Engineering', 'Process Control'],
    subjectsStudied: ['Chemical Process', 'Heat Transfer', 'Mass Transfer', 'Process Control'],
    careerPaths: ['Core Engineering', 'Research'],
    roles: ['Chemical Engineer', 'Process Engineer', 'Plant Engineer'],
    pros: ['Strong in pharma, energy and materials', 'Research-oriented', 'Process-scale thinking'],
    cons: ['Requires strong chemistry and math', 'Often plant-location based'],
  },
  {
    id: 'mechatronics',
    name: 'Mechatronics / Robotics',
    short: 'Mechatronics',
    description: 'Integration of mechanical, electronic and software systems.',
    interestTags: ['machines', 'electronics', 'programming'],
    subjectTags: ['Physics', 'Mathematics', 'Computer Science'],
    keySkills: ['Control Systems', 'Embedded Systems', 'Robotics', 'Programming'],
    subjectsStudied: ['Robotics', 'Embedded Systems', 'Control Systems', 'Sensors & Actuators'],
    careerPaths: ['Core Engineering', 'Research', 'Design'],
    roles: ['Robotics Engineer', 'Automation Engineer', 'Control Engineer'],
    pros: ['Interdisciplinary and future-focused', 'Automation and manufacturing demand', 'Hands-on systems'],
    cons: ['Spans many fields (can feel broad)', 'Needs hardware access'],
  },
]
