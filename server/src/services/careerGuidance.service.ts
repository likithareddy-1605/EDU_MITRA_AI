import { generateText, isAiConfigured } from './ai/geminiClient'

export interface CareerGuidanceContext {
  studentName: string
  branch: string
  year: string
  careerInterest: string
  currentSkills: string[]
  cgpa: number
  targetRole?: string
}

export interface CareerGuidanceResult {
  source: 'ai' | 'fallback'
  personalizedAdvice: string
  prioritySkills: string[]
  recommendedActions: string[]
  recommendedResources: { title: string; type: string; url: string; platform: string }[]
}

function getRuleBasedResources(interest: string) {
  const norm = interest.toLowerCase()
  if (norm.includes('data') || norm.includes('ml') || norm.includes('ai')) {
    return [
      { title: 'Machine Learning Specialization', type: 'Course', url: 'https://www.coursera.org/specializations/machine-learning-introduction', platform: 'Coursera / DeepLearning.AI' },
      { title: 'Kaggle Learn Micro-Courses', type: 'Interactive Practice', url: 'https://www.kaggle.com/learn', platform: 'Kaggle' },
      { title: 'Fast.ai Practical Deep Learning', type: 'Open Course', url: 'https://course.fast.ai/', platform: 'fast.ai' },
      { title: 'NPTEL Deep Learning', type: 'Swayam Video', url: 'https://nptel.ac.in/courses/106106184', platform: 'NPTEL' },
    ]
  }
  if (norm.includes('cloud') || norm.includes('devops')) {
    return [
      { title: 'DevOps Roadmap & Guide', type: 'Interactive Roadmap', url: 'https://roadmap.sh/devops', platform: 'roadmap.sh' },
      { title: 'Docker & Kubernetes Fundamentals', type: 'Tutorial Guide', url: 'https://docs.docker.com/get-started/', platform: 'Docker Docs' },
      { title: 'AWS Skill Builder Free Tier', type: 'Cloud Training', url: 'https://explore.skillbuilder.aws/', platform: 'AWS' },
      { title: 'Linux Journey Interactive', type: 'Practice', url: 'https://linuxjourney.com/', platform: 'LinuxJourney' },
    ]
  }
  if (norm.includes('cyber') || norm.includes('security')) {
    return [
      { title: 'OverTheWire Wargames', type: 'Hands-on Labs', url: 'https://overthewire.org/wargames/', platform: 'OverTheWire' },
      { title: 'TryHackMe Pre-Security Path', type: 'Interactive Practice', url: 'https://tryhackme.com/', platform: 'TryHackMe' },
      { title: 'PortSwigger Web Security Academy', type: 'Labs & Tutorials', url: 'https://portswigger.net/web-security', platform: 'PortSwigger' },
    ]
  }
  if (norm.includes('embed') || norm.includes('hardware') || norm.includes('electronics')) {
    return [
      { title: 'NPTEL Embedded System Design', type: 'Video Course', url: 'https://nptel.ac.in/courses/108102045', platform: 'NPTEL' },
      { title: 'Embedded Systems - Shape the World', type: 'Interactive Course', url: 'https://users.ece.utexas.edu/~valvano/edX/', platform: 'UT Austin / edX' },
      { title: 'All About Circuits Textbook', type: 'Open Textbook', url: 'https://www.allaboutcircuits.com/textbook/', platform: 'All About Circuits' },
    ]
  }
  // Default software engineering
  return [
    { title: 'NeetCode 150 - DSA Roadmap', type: 'Coding Practice', url: 'https://neetcode.io/practice', platform: 'NeetCode' },
    { title: 'freeCodeCamp Full Stack Curriculum', type: 'Hands-on Projects', url: 'https://www.freecodecamp.org/', platform: 'freeCodeCamp' },
    { title: 'System Design Primer', type: 'Guide & Diagrams', url: 'https://github.com/donnemartin/system-design-primer', platform: 'GitHub Open Source' },
    { title: 'CS50 Introduction to Computer Science', type: 'Video Lecture Series', url: 'https://cs50.harvard.edu/x/', platform: 'Harvard OCW' },
  ]
}

export async function getCareerGuidance(ctx: CareerGuidanceContext): Promise<CareerGuidanceResult> {
  const resources = getRuleBasedResources(ctx.careerInterest || ctx.targetRole || '')

  if (!isAiConfigured) {
    return {
      source: 'fallback',
      personalizedAdvice: `(Demo mode — rule-based guidance) For a ${ctx.year} student in ${ctx.branch} aiming for ${ctx.targetRole || ctx.careerInterest || 'a tech role'}: Prioritize building a solid core portfolio with 2 production-ready projects, practice standard technical interview questions, and maintain a CGPA above 7.5 to ensure eligibility across major campus recruitment drives.`,
      prioritySkills: ['Data Structures & Algorithms', 'System Architecture Fundamentals', 'Git & Collaborative Version Control', 'Applied Project Experience'],
      recommendedActions: [
        `Complete at least 50 fundamental coding problems focusing on arrays, strings, and hash maps.`,
        `Build a capstone project solving a genuine problem, with a live demo link and README on GitHub.`,
        `Prepare an ATS-friendly single-page resume highlighting technical contributions and course projects.`,
        `Engage with campus placement cells and alumni working in ${ctx.targetRole || 'your target field'}.`
      ],
      recommendedResources: resources
    }
  }

  try {
    const prompt = [
      'You are a senior engineering career counselor and mentor in India.',
      'Provide concise, honest, pragmatic career guidance tailored to this student profile.',
      `Student Name: ${ctx.studentName}`,
      `Department / Branch: ${ctx.branch}`,
      `Year of Study: ${ctx.year}`,
      `CGPA: ${ctx.cgpa.toFixed(2)}`,
      `Target Career / Role: ${ctx.targetRole || ctx.careerInterest}`,
      `Current Skills Acquired: ${ctx.currentSkills.join(', ') || 'Basics'}`,
      'Respond with a JSON object ONLY with the following exact keys:',
      '{"personalizedAdvice": "string (under 120 words)", "prioritySkills": ["skill1", "skill2", "skill3", "skill4"], "recommendedActions": ["action1", "action2", "action3", "action4"]}',
      'Do not include markdown code fences or backticks. Return valid JSON only.'
    ].join('\n')

    const raw = await generateText(prompt)
    const cleaned = raw.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      source: 'ai',
      personalizedAdvice: parsed.personalizedAdvice || 'Focus on consistent skill progression and project depth.',
      prioritySkills: Array.isArray(parsed.prioritySkills) ? parsed.prioritySkills : ['Core DSA', 'Problem Solving'],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Build portfolio projects'],
      recommendedResources: resources
    }
  } catch {
    return {
      source: 'fallback',
      personalizedAdvice: `For a ${ctx.year} student in ${ctx.branch}: Focus on bridging required technical skills, building verified project demonstrations, and preparing for campus interviews.`,
      prioritySkills: ['Core Problem Solving', 'Domain-Specific Frameworks', 'Database Management', 'Communication & System Design'],
      recommendedActions: [
        'Build and deploy 2 verified projects to GitHub with live URLs.',
        'Review standard interview questions for your chosen engineering domain.',
        'Participate in mock technical interviews.',
        'Track internships on reliable portals like Internshala, LinkedIn, or college TPO.'
      ],
      recommendedResources: resources
    }
  }
}
