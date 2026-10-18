import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ChipSelect, type ChipOption } from '@/components/ui/ChipSelect'
import type {
  EngineeringEducationStage,
  ParentOnboardingData,
  StudentOnboardingData,
} from '@/types'
import { requestParentLink } from '@/services/parentStudentLink'

const BRANCH_OPTIONS: ChipOption[] = [
  { value: 'Computer Science & Engineering (CSE)', label: 'Computer Science (CSE)' },
  { value: 'Artificial Intelligence & Machine Learning', label: 'AI & Machine Learning' },
  { value: 'Data Science & Analytics', label: 'Data Science' },
  { value: 'Electronics & Communication (ECE)', label: 'Electronics & Comm (ECE)' },
  { value: 'Information Technology (IT)', label: 'Information Technology (IT)' },
  { value: 'Electrical & Electronics (EEE)', label: 'Electrical & Electronics (EEE)' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engg' },
  { value: 'Civil Engineering', label: 'Civil Engg' },
  { value: 'Aerospace Engineering', label: 'Aerospace Engg' },
]

const ENTRANCE_EXAMS = [
  { value: '', label: 'Select Entrance Exam (or Exploring)' },
  { value: 'JEE Main', label: 'JEE Main' },
  { value: 'JEE Advanced', label: 'JEE Advanced' },
  { value: 'TS EAMCET', label: 'TS EAMCET (Telangana)' },
  { value: 'AP EAPCET', label: 'AP EAPCET (Andhra Pradesh)' },
  { value: 'KCET', label: 'KCET (Karnataka)' },
  { value: 'MHT-CET', label: 'MHT-CET (Maharashtra)' },
  { value: 'BITSAT', label: 'BITSAT' },
  { value: 'Other / Exploring', label: 'Other State CET / Exploring' },
]

const BUDGET_OPTIONS = [
  { value: '', label: 'Select Expected Annual Budget' },
  { value: 'Under ₹1 Lakh/year', label: 'Under ₹1 Lakh/year (Govt / Scholarship)' },
  { value: '₹1 - 2 Lakhs/year', label: '₹1 - 2 Lakhs/year' },
  { value: '₹2 - 4 Lakhs/year', label: '₹2 - 4 Lakhs/year' },
  { value: '₹4+ Lakhs/year', label: '₹4+ Lakhs/year (Private / Deemed)' },
  { value: 'Flexible / Merit Based', label: 'Flexible / Merit Based' },
]

const QUALIFICATION_OPTIONS = [
  { value: '', label: 'Select Current Qualification' },
  { value: 'Intermediate 2nd Year (MPC)', label: 'Intermediate 2nd Year (MPC)' },
  { value: 'Intermediate 1st Year (MPC)', label: 'Intermediate 1st Year (MPC)' },
  { value: 'Class 12 (CBSE / ICSE - PCM)', label: 'Class 12 (CBSE / ICSE - PCM)' },
  { value: 'Class 11 (CBSE / ICSE - PCM)', label: 'Class 11 (CBSE / ICSE - PCM)' },
  { value: 'Diploma / Polytechnic 3rd Year', label: 'Diploma / Polytechnic (Lateral Entry)' },
  { value: 'Repeater / Long-term Aspirant', label: 'Repeater / Long-term Aspirant' },
]

const CAREER_GOALS: ChipOption[] = [
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'AI / ML Engineer', label: 'AI / ML Engineer' },
  { value: 'Cloud & DevOps Architect', label: 'Cloud & DevOps' },
  { value: 'Cybersecurity Analyst', label: 'Cybersecurity' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'Embedded Systems / IoT', label: 'Embedded & IoT' },
  { value: 'Core Engineering / PSU', label: 'Core Industry / PSU' },
  { value: 'Higher Studies (M.Tech / MS abroad)', label: 'Higher Studies (MS/M.Tech)' },
  { value: 'Tech Entrepreneur / Startup', label: 'Tech Entrepreneur' },
]

const COMMON_SUBJECTS: ChipOption[] = [
  { value: 'Mathematics / Calculus', label: 'Mathematics / Calculus' },
  { value: 'Data Structures & Algorithms', label: 'Data Structures & Algorithms' },
  { value: 'Programming (Python / Java / C++)', label: 'Programming (Python/Java/C++)' },
  { value: 'Digital Logic & Circuit Design', label: 'Digital Logic & Circuits' },
  { value: 'Database Management Systems', label: 'DBMS' },
  { value: 'Computer Networks', label: 'Computer Networks' },
  { value: 'Operating Systems', label: 'Operating Systems' },
  { value: 'Physics / Engineering Mechanics', label: 'Physics / Mechanics' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, completeStudentOnboarding, completeParentOnboarding } = useAuth()
  const isParent = user?.role === 'parent'

  // Wizard state
  const [step, setStep] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // STUDENT STATE
  const [educationStage, setEducationStage] = useState<EngineeringEducationStage | null>(null)

  // Planning stage state
  const [currentQualification, setCurrentQualification] = useState('')
  const [preferredBranches, setPreferredBranches] = useState<string[]>([])
  const [entranceExam, setEntranceExam] = useState('')
  const [entranceScoreOrRank, setEntranceScoreOrRank] = useState('')
  const [expectedBudget, setExpectedBudget] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')

  // Studying stage state
  const [college, setCollege] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('1st Year')
  const [semester, setSemester] = useState('Semester 1')
  const [cgpa, setCgpa] = useState('')
  const [strongSubjects, setStrongSubjects] = useState<string[]>([])
  const [weakSubjects, setWeakSubjects] = useState<string[]>([])

  // Common student state
  const [careerGoals, setCareerGoals] = useState<string[]>([])
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(3)
  const [preferredLearning, setPreferredLearning] = useState('Hands-on coding, practical projects, and guided mentor feedback')

  // PARENT STATE
  const [relationship, setRelationship] = useState('Father')
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentStage, setStudentStage] = useState<EngineeringEducationStage>('planning')
  const [commPreference, setCommPreference] = useState('Weekly email summary with milestone progress')
  const [supportPriorities, setSupportPriorities] = useState<string[]>([
    'College & Branch Selection Guidance',
    'Career Planning & Industry Trends',
  ])

  // Navigation validation
  const validateStep = (): boolean => {
    setErrorMsg(null)

    if (isParent) {
      if (step === 1 && !relationship.trim()) {
        setErrorMsg('Please specify your relationship with the student.')
        return false
      }
      if (step === 2 && !studentName.trim()) {
        setErrorMsg("Please enter the student's name.")
        return false
      }
      return true
    }

    // Student validation
    if (step === 1) {
      if (!educationStage) {
        setErrorMsg('Please select your current stage of engineering education.')
        return false
      }
    } else if (step === 2) {
      if (educationStage === 'planning') {
        if (!currentQualification) {
          setErrorMsg('Please select your current class or qualification.')
          return false
        }
        if (preferredBranches.length === 0) {
          setErrorMsg('Please select at least one preferred engineering branch.')
          return false
        }
      } else if (educationStage === 'studying') {
        if (!college.trim()) {
          setErrorMsg('Please enter your college name.')
          return false
        }
        if (!branch.trim()) {
          setErrorMsg('Please enter your engineering branch.')
          return false
        }
      }
    } else if (step === 3) {
      if (careerGoals.length === 0) {
        setErrorMsg('Please select at least one career interest or goal.')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    setErrorMsg(null)
    setStep((s) => Math.max(1, s - 1))
  }

  const handleFinish = async () => {
    if (!validateStep()) return

    setSubmitting(true)
    setErrorMsg(null)

    try {
      if (isParent) {
        const payload: ParentOnboardingData = {
          relationship,
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim() || undefined,
          studentStage,
          communicationPreference: commPreference,
          supportPriorities,
        }
        const res = await completeParentOnboarding(payload)
        if (res.success) {
          if (studentEmail.trim() && user?.id) {
            try {
              await requestParentLink(user.id, studentEmail.trim())
            } catch {
              /* ignore linking note */
            }
          }
          navigate('/parent', { replace: true })
        } else {
          setErrorMsg(res.error || 'Failed to complete parent onboarding.')
        }
      } else {
        if (!educationStage) return

        let payload: StudentOnboardingData
        if (educationStage === 'planning') {
          payload = {
            stage: 'planning',
            currentQualification,
            preferredBranches,
            entranceExam: entranceExam || undefined,
            entranceScoreOrRank: entranceScoreOrRank.trim() || undefined,
            expectedBudget: expectedBudget || undefined,
            preferredLocation: preferredLocation.trim() || undefined,
            careerGoals,
            academicInterests: preferredBranches,
            dailyStudyHours,
          }
        } else {
          payload = {
            stage: 'studying',
            college: college.trim(),
            branch: branch.trim(),
            year,
            semester,
            cgpa: parseFloat(cgpa) || 0,
            strongSubjects,
            weakSubjects,
            careerGoals,
            dailyStudyHours,
            preferredLearning,
          }
        }

        const res = await completeStudentOnboarding(payload)
        if (res.success) {
          navigate('/student', { replace: true })
        } else {
          setErrorMsg(res.error || 'Failed to complete student onboarding.')
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during onboarding.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSelection = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  const totalSteps = 4
  const progressPercent = Math.round((step / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-canvas py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
            <Sparkles size={14} className="text-blue-600" />
            <span>EduMitra AI Personalized Setup</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {isParent ? 'Parent Onboarding & Student Link' : 'Welcome to EduMitra — Guided Setup'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {isParent
              ? 'Tell us how you would like to track and support your student’s engineering journey.'
              : 'Help us calibrate your personalized dashboard, academic roadmap, and Gemini AI advice.'}
          </p>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium text-ink-muted mb-1.5">
              <span>Step {step} of {totalSteps}</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wizard card */}
        <Card className="p-4 sm:p-8 border-slate-200 bg-white shadow-sm">
          {errorMsg && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <p className="font-medium">Please check the following:</p>
              <p className="mt-0.5 text-xs text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* PARENT ONBOARDING STEPS */}
          {isParent && (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Step 1: Your Relationship to the Student</h2>
                    <p className="text-sm text-ink-muted mt-1">
                      Help us customize parent communications and decision support.
                    </p>
                  </div>

                  <Field label="Full Name" htmlFor="parentName">
                    <Input
                      id="parentName"
                      disabled
                      value={user?.displayName || 'Parent'}
                      className="bg-slate-50 text-slate-500"
                    />
                  </Field>

                  <Field label="Registered Email" htmlFor="parentEmail">
                    <Input
                      id="parentEmail"
                      disabled
                      value={user?.email || ''}
                      className="bg-slate-50 text-slate-500"
                    />
                  </Field>

                  <Field label="Relationship to Student" htmlFor="relationship" required>
                    <Select
                      id="relationship"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Legal Guardian">Legal Guardian / Family Member</option>
                    </Select>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Step 2: Student Linking Information</h2>
                    <p className="text-sm text-ink-muted mt-1">
                      Link the student profile so you can view academic summaries and family decisions.
                    </p>
                  </div>

                  <Field label="Student's Full Name" htmlFor="studentName" required>
                    <Input
                      id="studentName"
                      placeholder="e.g. Aarav Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </Field>

                  <Field
                    label="Student's Registered Email (Optional)"
                    htmlFor="studentEmail"
                    hint="If the student has an EduMitra account, enter their email to synchronize shared milestones."
                  >
                    <Input
                      id="studentEmail"
                      type="email"
                      placeholder="e.g. student@example.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </Field>

                  <Field label="Student's Current Education Stage" htmlFor="studentStage" required>
                    <div className="grid gap-3 sm:grid-cols-2 mt-2">
                      <div
                        onClick={() => setStudentStage('planning')}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          studentStage === 'planning'
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <Compass size={18} className="text-blue-600" />
                          <span>Planning Engineering</span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1">
                          Preparing for entrance exams, choosing branches, evaluating colleges.
                        </p>
                      </div>

                      <div
                        onClick={() => setStudentStage('studying')}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          studentStage === 'studying'
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <GraduationCap size={18} className="text-blue-600" />
                          <span>Studying Engineering</span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1">
                          Already enrolled in an engineering college, managing CGPA and career readiness.
                        </p>
                      </div>
                    </div>
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Step 3: Communication & Family Support Priorities</h2>
                    <p className="text-sm text-ink-muted mt-1">
                      Choose what insights and updates matter most to your family.
                    </p>
                  </div>

                  <Field label="Preferred Communication Cadence" htmlFor="commPref">
                    <Select
                      id="commPref"
                      value={commPreference}
                      onChange={(e) => setCommPreference(e.target.value)}
                    >
                      <option value="Weekly email summary with milestone progress">
                        Weekly email summary with milestone progress
                      </option>
                      <option value="Monthly consolidated academic & decision report">
                        Monthly consolidated academic & decision report
                      </option>
                      <option value="Critical exam and deadline alerts only">
                        Critical exam and deadline alerts only
                      </option>
                      <option value="In-app dashboard reviews only">
                        In-app dashboard reviews only
                      </option>
                    </Select>
                  </Field>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Family Decision & Support Focus Areas
                    </label>
                    <div className="space-y-2">
                      {[
                        'College & Branch Selection Guidance',
                        'Career Planning & Industry Trends',
                        'Academic Stress & Wellbeing Balance',
                        'Higher Education (MS / GATE / MBA) Planning',
                        'Budget & Education Loan Evaluation',
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3 text-sm text-ink cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={supportPriorities.includes(item)}
                            onChange={() =>
                              toggleSelection(supportPriorities, setSupportPriorities, item)
                            }
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Step 4: Review & Complete Setup</h2>
                    <p className="text-sm text-ink-muted mt-1">
                      Please review your setup details before entering the Parent Dashboard.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-ink-muted">Parent Name:</span>
                      <span className="font-medium text-ink">{user?.displayName} ({relationship})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-ink-muted">Linked Student:</span>
                      <span className="font-medium text-ink">{studentName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-ink-muted">Student Stage:</span>
                      <span className="font-medium text-ink capitalize">
                        {studentStage === 'planning' ? 'Planning to Join Engineering' : 'Already Studying Engineering'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-ink-muted">Communication:</span>
                      <span className="font-medium text-ink">{commPreference}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block mb-1">Support Priorities:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {supportPriorities.map((p) => (
                          <span key={p} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs text-ink">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STUDENT ONBOARDING STEPS */}
          {!isParent && (
            <>
              {/* STEP 1: MANDATORY EDUCATION STATUS SELECTION */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-ink">
                      Which stage of engineering education are you currently in?
                    </h2>
                    <p className="text-sm text-ink-muted mt-1.5">
                      EduMitra customizes your guidance, roadmap, and AI tools based on where you are right now.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 pt-2">
                    {/* OPTION 1: PLANNING TO JOIN */}
                    <div
                      onClick={() => setEducationStage('planning')}
                      className={`group relative cursor-pointer rounded-2xl border-2 p-4 sm:p-6 transition-all ${
                        educationStage === 'planning'
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-4 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                          <Compass size={26} />
                        </div>
                        {educationStage === 'planning' && (
                          <CheckCircle2 size={22} className="text-blue-600" />
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-ink">
                        Planning to Join Engineering
                      </h3>
                      <ul className="mt-2.5 space-y-1.5 text-xs text-ink-muted">
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          I am preparing to join an engineering college.
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          I am exploring engineering branches and colleges.
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Compare entrance exams, cutoff trends, and family decisions.
                        </li>
                      </ul>
                    </div>

                    {/* OPTION 2: ALREADY STUDYING */}
                    <div
                      onClick={() => setEducationStage('studying')}
                      className={`group relative cursor-pointer rounded-2xl border-2 p-4 sm:p-6 transition-all ${
                        educationStage === 'studying'
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-4 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                          <GraduationCap size={26} />
                        </div>
                        {educationStage === 'studying' && (
                          <CheckCircle2 size={22} className="text-emerald-600" />
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-ink">
                        Already Studying Engineering
                      </h3>
                      <ul className="mt-2.5 space-y-1.5 text-xs text-ink-muted">
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          I have already joined an engineering college.
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Track semester CGPA, subjects, and study planner.
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Receive engineering career roadmaps & Gemini AI study advice.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ADAPTIVE ACADEMIC DETAILS */}
              {step === 2 && (
                <div className="space-y-6">
                  {educationStage === 'planning' ? (
                    <>
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-1">
                          <Compass size={13} /> Planning Aspirant Path
                        </div>
                        <h2 className="text-lg font-semibold text-ink">
                          Aspirant Academic & College Exploration Details
                        </h2>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Tell us about your qualification, preferred branches, and target colleges.
                        </p>
                      </div>

                      <Field label="Current Class or Qualification" htmlFor="qualification" required>
                        <Select
                          id="qualification"
                          value={currentQualification}
                          onChange={(e) => setCurrentQualification(e.target.value)}
                        >
                          {QUALIFICATION_OPTIONS.map((q) => (
                            <option key={q.value} value={q.value}>
                              {q.label}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <div>
                        <label className="block text-sm font-medium text-ink mb-2">
                          Preferred Engineering Branches (Select 1 or more) *
                        </label>
                        <ChipSelect
                          options={BRANCH_OPTIONS}
                          selected={preferredBranches}
                          onToggle={(val) => toggleSelection(preferredBranches, setPreferredBranches, val)}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Entrance Exam (Targeted or Taken)" htmlFor="entranceExam">
                          <Select
                            id="entranceExam"
                            value={entranceExam}
                            onChange={(e) => setEntranceExam(e.target.value)}
                          >
                            {ENTRANCE_EXAMS.map((ex) => (
                              <option key={ex.value} value={ex.value}>
                                {ex.label}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field
                          label="Score or Expected Rank (Optional)"
                          htmlFor="entranceScore"
                          hint="e.g. Rank 14,200 or 92 Percentile"
                        >
                          <Input
                            id="entranceScore"
                            placeholder="e.g. Rank 12,500"
                            value={entranceScoreOrRank}
                            onChange={(e) => setEntranceScoreOrRank(e.target.value)}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Expected College Budget" htmlFor="budget">
                          <Select
                            id="budget"
                            value={expectedBudget}
                            onChange={(e) => setExpectedBudget(e.target.value)}
                          >
                            {BUDGET_OPTIONS.map((b) => (
                              <option key={b.value} value={b.value}>
                                {b.label}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field
                          label="Preferred College Location"
                          htmlFor="location"
                          hint="e.g. Hyderabad, Bengaluru, Pune, Home State"
                        >
                          <Input
                            id="location"
                            placeholder="e.g. Hyderabad, Telangana"
                            value={preferredLocation}
                            onChange={(e) => setPreferredLocation(e.target.value)}
                          />
                        </Field>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 mb-1">
                          <GraduationCap size={13} /> Enrolled Engineering Student Path
                        </div>
                        <h2 className="text-lg font-semibold text-ink">
                          Current College & Engineering Academic Status
                        </h2>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Enter your active college, branch, semester, and academic marks.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="College / University Name" htmlFor="college" required>
                          <Input
                            id="college"
                            placeholder="e.g. JNTU College of Engineering"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                          />
                        </Field>

                        <Field label="Engineering Branch" htmlFor="branch" required>
                          <Input
                            id="branch"
                            placeholder="e.g. Computer Science & Engineering"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Current Year" htmlFor="year">
                          <Select id="year" value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </Select>
                        </Field>

                        <Field label="Current Semester" htmlFor="semester">
                          <Select
                            id="semester"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={`Semester ${s}`}>
                                Semester {s}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Current CGPA or % (Optional)" htmlFor="cgpa" hint="Scale of 10.0">
                          <Input
                            id="cgpa"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="e.g. 8.4"
                            value={cgpa}
                            onChange={(e) => setCgpa(e.target.value)}
                          />
                        </Field>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Strong Academic Subjects
                        </label>
                        <ChipSelect
                          options={COMMON_SUBJECTS}
                          selected={strongSubjects}
                          onToggle={(val) => toggleSelection(strongSubjects, setStrongSubjects, val)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Subjects Requiring Improvement or AI Study Plans
                        </label>
                        <ChipSelect
                          options={COMMON_SUBJECTS}
                          selected={weakSubjects}
                          onToggle={(val) => toggleSelection(weakSubjects, setWeakSubjects, val)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: GOALS, STUDY HOURS & LEARNING PREFERENCE */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Career Aspirations, Daily Study & Learning Style
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      These parameters personalize your study scheduler and Gemini AI recommendations.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Target Engineering Career Paths (Select all that apply) *
                    </label>
                    <ChipSelect
                      options={CAREER_GOALS}
                      selected={careerGoals}
                      onToggle={(val) => toggleSelection(careerGoals, setCareerGoals, val)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="studyHours" className="text-sm font-medium text-ink">
                        Available Daily Self-Study Hours
                      </label>
                      <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {dailyStudyHours} hours / day
                      </span>
                    </div>
                    <input
                      id="studyHours"
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={dailyStudyHours}
                      onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                      className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-ink-muted mt-1">
                      <span>1 hr (Light)</span>
                      <span>3-4 hrs (Recommended)</span>
                      <span>8 hrs (Intensive)</span>
                    </div>
                  </div>

                  <Field
                    label="Preferred Learning Approach"
                    htmlFor="prefLearning"
                    hint="Helps AI Advisor structure study plans to fit your learning method."
                  >
                    <Textarea
                      id="prefLearning"
                      rows={2}
                      value={preferredLearning}
                      onChange={(e) => setPreferredLearning(e.target.value)}
                      placeholder="e.g. Hands-on coding, solving previous year papers, video lectures..."
                    />
                  </Field>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRMATION */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Review Your Profile & Launch Dashboard
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Confirm your details below. You can update these anytime in your Profile & Settings.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3.5 text-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <span className="text-ink-muted">Education Status:</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                        {educationStage === 'planning' ? (
                          <>
                            <Compass size={13} /> Planning to Join Engineering
                          </>
                        ) : (
                          <>
                            <GraduationCap size={13} /> Already Studying Engineering
                          </>
                        )}
                      </span>
                    </div>

                    {educationStage === 'planning' ? (
                      <>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-ink-muted">Current Qualification:</span>
                          <span className="font-medium text-ink">{currentQualification || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-ink-muted">Preferred Branches:</span>
                          <span className="font-medium text-ink text-right max-w-[65%]">
                            {preferredBranches.join(', ') || '—'}
                          </span>
                        </div>
                        {entranceExam && (
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-ink-muted">Target Entrance Exam:</span>
                            <span className="font-medium text-ink">
                              {entranceExam} {entranceScoreOrRank ? `(${entranceScoreOrRank})` : ''}
                            </span>
                          </div>
                        )}
                        {expectedBudget && (
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-ink-muted">Budget Preference:</span>
                            <span className="font-medium text-ink">{expectedBudget}</span>
                          </div>
                        )}
                        {preferredLocation && (
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-ink-muted">Target Location:</span>
                            <span className="font-medium text-ink">{preferredLocation}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-ink-muted">College:</span>
                          <span className="font-medium text-ink">{college || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-ink-muted">Branch & Year:</span>
                          <span className="font-medium text-ink">
                            {branch} • {year} ({semester})
                          </span>
                        </div>
                        {cgpa && (
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-ink-muted">Initial CGPA:</span>
                            <span className="font-bold text-blue-600">{cgpa} / 10.0</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-ink-muted">Career Interests:</span>
                      <span className="font-medium text-ink text-right max-w-[65%]">
                        {careerGoals.join(', ') || '—'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-ink-muted">Daily Study Hours:</span>
                      <span className="font-medium text-ink">{dailyStudyHours} hrs/day</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={handleBack} disabled={submitting}>
                <ArrowLeft size={16} /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Save & Enter Dashboard
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
