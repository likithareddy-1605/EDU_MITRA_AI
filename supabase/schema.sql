-- =============================================================================
-- EduMitra AI - Supabase PostgreSQL Schema & Row Level Security (RLS) Policies
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'parent', 'admin')),
  display_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Student Profiles
create table if not exists public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  branch text not null default 'Computer Science & Engineering',
  year text not null default '3rd Year',
  college text not null default '',
  cgpa numeric(4, 2) not null default 0.00,
  academic_interests text[] default '{}',
  career_interests text[] default '{}',
  current_goal text default '',
  preferred_learning text default 'Hands-on projects and visual guides',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Parent-Student Relationship Links (Explicit Student Authorization)
create table if not exists public.parent_student_links (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'revoked')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (parent_id, student_id)
);

-- 4. Academic Records (Subject marks per semester)
create table if not exists public.academic_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  semester integer not null check (semester between 1 and 10),
  subject text not null,
  marks numeric(5, 2) not null check (marks between 0 and 100),
  grade text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Student Goals (With Student-Controlled Parent Sharing)
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null check (category in ('academic', 'programming', 'project', 'certification', 'internship', 'placement', 'career')),
  status text not null check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  progress integer not null default 0 check (progress between 0 and 100),
  deadline date,
  shared boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Study Tasks (Weekly Study Planner)
create table if not exists public.study_tasks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  day text not null check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  priority text not null check (priority in ('high', 'medium', 'low')) default 'medium',
  completed boolean not null default false,
  completed_at date,
  due date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Study Activities (Daily learning streak tracking)
create table if not exists public.study_activities (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null default current_date,
  minutes integer default 45,
  unique (student_id, activity_date)
);

-- 8. Achievements
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type text not null check (type in ('project', 'certification', 'goal', 'award')),
  achievement_date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Family Decisions (Module E)
create table if not exists public.family_decisions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete set null,
  selected_branch_ids text[] default '{}',
  student_preference jsonb default '{"preferredBranchId": "", "notes": ""}',
  parent_preference jsonb default '{"preferredBranchId": "", "notes": ""}',
  final_branch_id text default '',
  rationale text default '',
  concerns text default '',
  trade_offs text default '',
  saved_at timestamp with time zone default timezone('utc'::text, now()),
  unique(student_id)
);

-- 10. Student Wellbeing Logs
create table if not exists public.wellbeing_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  study_hours numeric(3, 1) default 0,
  screen_hours numeric(3, 1) default 0,
  water_glasses integer default 0,
  breaks_taken integer default 0,
  mood text check (mood in ('great', 'good', 'neutral', 'tired', 'stressed')) default 'neutral',
  notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, log_date)
);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.academic_records enable row level security;
alter table public.goals enable row level security;
alter table public.study_tasks enable row level security;
alter table public.study_activities enable row level security;
alter table public.achievements enable row level security;
alter table public.family_decisions enable row level security;
alter table public.wellbeing_logs enable row level security;

-- Profiles: Users can view and manage their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Student Profiles: Student has full access; linked approved Parent has read access
create policy "Students can view own profile" on public.student_profiles
  for all using (auth.uid() = user_id);
create policy "Approved parents can view linked student profile" on public.student_profiles
  for select using (
    exists (
      select 1 from public.parent_student_links
      where parent_id = auth.uid() and student_id = user_id and status = 'approved'
    )
  );

-- Academic Records: Student can manage; approved parent can view
create policy "Students can manage own academic records" on public.academic_records
  for all using (auth.uid() = student_id);
create policy "Approved parents can view student academic records" on public.academic_records
  for select using (
    exists (
      select 1 from public.parent_student_links
      where parent_id = auth.uid() and student_id = academic_records.student_id and status = 'approved'
    )
  );

-- Goals: Student can manage; approved parent can view ONLY shared goals
create policy "Students can manage own goals" on public.goals
  for all using (auth.uid() = student_id);
create policy "Approved parents can view shared goals only" on public.goals
  for select using (
    shared = true and exists (
      select 1 from public.parent_student_links
      where parent_id = auth.uid() and student_id = goals.student_id and status = 'approved'
    )
  );

-- Study Tasks & Wellbeing: Private to student
create policy "Students can manage own study tasks" on public.study_tasks
  for all using (auth.uid() = student_id);
create policy "Students can manage own study activities" on public.study_activities
  for all using (auth.uid() = student_id);
create policy "Students can manage own wellbeing logs" on public.wellbeing_logs
  for all using (auth.uid() = student_id);

-- Achievements: Visible to student and approved parent
create policy "Students can manage own achievements" on public.achievements
  for all using (auth.uid() = student_id);
create policy "Approved parents can view achievements" on public.achievements
  for select using (
    exists (
      select 1 from public.parent_student_links
      where parent_id = auth.uid() and student_id = achievements.student_id and status = 'approved'
    )
  );

-- Family Decisions: Both student and approved parent can collaborate
create policy "Students can manage own family decision" on public.family_decisions
  for all using (auth.uid() = student_id);
create policy "Approved parents can participate in family decision" on public.family_decisions
  for all using (
    exists (
      select 1 from public.parent_student_links
      where parent_id = auth.uid() and student_id = family_decisions.student_id and status = 'approved'
    )
  );
