// Static, descriptive career-path metadata for the Career Guidance module.
// These are descriptive facts (skills, roles, steps) — NOT fabricated salary
// or placement statistics.

export interface CareerPath {
  id: string
  title: string
  description: string
  interestTags: string[]
  requiredSkills: string[]
  roles: string[]
  steps: string[]
}

export const careers: CareerPath[] = [
  {
    id: 'swe',
    title: 'Software Engineer',
    description: 'Design, build and maintain software applications and systems.',
    interestTags: ['programming', 'ai-data', 'creativity'],
    requiredSkills: ['Data Structures', 'Algorithms', 'System Design', 'DBMS', 'Programming'],
    roles: ['Backend Engineer', 'Frontend Engineer', 'Full-stack Developer'],
    steps: [
      'Master DSA (150+ problems)',
      'Build 2-3 full-stack projects',
      'Practice system design basics',
      'Apply for summer internships',
      'Prepare for technical interviews',
    ],
  },
  {
    id: 'ds',
    title: 'Data Scientist',
    description: 'Analyze data, build ML models and drive data-informed decisions.',
    interestTags: ['ai-data', 'research', 'programming'],
    requiredSkills: ['Statistics', 'Python', 'SQL', 'Machine Learning', 'Data Visualization'],
    roles: ['Data Analyst', 'ML Engineer', 'Data Scientist'],
    steps: [
      'Strengthen statistics and linear algebra',
      'Complete an ML certification',
      'Build 2 data projects with real datasets',
      'Practice SQL and data storytelling',
      'Apply for data roles',
    ],
  },
  {
    id: 'ml',
    title: 'ML Engineer',
    description: 'Build, train and deploy machine learning models in production.',
    interestTags: ['ai-data', 'programming', 'research'],
    requiredSkills: ['Python', 'Deep Learning', 'MLOps', 'Mathematics', 'Cloud'],
    roles: ['ML Engineer', 'AI Research Engineer'],
    steps: [
      'Master Python and ML frameworks',
      'Build 2 deep learning projects',
      'Learn model deployment (Flask/FastAPI)',
      'Contribute to an open-source ML project',
      'Apply for ML roles',
    ],
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    description: 'Automate deployment, scale infrastructure and manage CI/CD.',
    interestTags: ['programming', 'management'],
    requiredSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud'],
    roles: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer'],
    steps: [
      'Learn Linux and networking fundamentals',
      'Get comfortable with Docker and Kubernetes',
      'Build a CI/CD pipeline project',
      'Earn a cloud certification (AWS/Azure)',
      'Apply for DevOps roles',
    ],
  },
  {
    id: 'pm',
    title: 'Product Manager',
    description: 'Define product vision, gather requirements and coordinate teams.',
    interestTags: ['management', 'creativity'],
    requiredSkills: ['Communication', 'Analytics', 'User Research', 'Roadmapping', 'Stakeholder Management'],
    roles: ['Associate PM', 'Product Manager', 'Technical PM'],
    steps: [
      'Read about product management frameworks',
      'Build a product case study',
      'Practice data-driven decision making',
      'Network with PMs and attend meetups',
      'Apply for APM programs',
    ],
  },
  {
    id: 'security',
    title: 'Cybersecurity Analyst',
    description: 'Protect systems from threats, audit security and respond to incidents.',
    interestTags: ['programming', 'research'],
    requiredSkills: ['Networking', 'Operating Systems', 'Cryptography', 'Penetration Testing', 'Python'],
    roles: ['Security Analyst', 'Penetration Tester', 'SOC Engineer'],
    steps: [
      'Learn networking and OS fundamentals',
      'Complete a security certification (e.g., CEH)',
      'Practice on CTF platforms',
      'Build a security audit project',
      'Apply for security roles',
    ],
  },
]

export const defaultResumeItems: string[] = [
  'Updated resume with latest projects',
  'GitHub profile with 2+ repositories',
  'LinkedIn profile updated',
  'Practiced 20+ DSA problems',
  'Prepared introduction pitch (2 min)',
  'Listed 3 projects with clear descriptions',
]
