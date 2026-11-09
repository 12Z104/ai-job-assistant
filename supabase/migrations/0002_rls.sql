-- 0002_rls.sql · 行级安全策略（对应 docs/ARCHITECTURE.md §6.3）
-- 原则：每张用户表开 RLS + for all 策略，默认拒绝；双层防御中 RLS 是兜底层
-- 警告：后端 service key 会绕过 RLS（唯一的危险点）——service key 写库必须自带 user_id 条件，代码评审重点

-- ============ profiles：本人可读写自己的扩展行 ============
alter table profiles enable row level security;

create policy "own_profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 注册触发器：auth.users 建用户时自动建 profiles 行（Supabase 侧执行）
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============ resumes / resume_versions / job_jds / match_results / interview_sessions ============
-- 统一模式：own_<table>，for all，using + with check 均 auth.uid() = user_id
alter table resumes         enable row level security;
alter table resume_versions enable row level security;
alter table job_jds         enable row level security;
alter table match_results   enable row level security;
alter table interview_sessions enable row level security;

create policy "own_resumes" on resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_resume_versions" on resume_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_job_jds" on job_jds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_match_results" on match_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_interview_sessions" on interview_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- resume_versions 的 user_id 通过 resume_id 关联，嵌套校验：
-- 只有属于本人的简历才能挂版本行
create policy "own_resume_versions_via_resume" on resume_versions
  for all using (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from resumes r where r.id = resume_id and r.user_id = auth.uid())
  );

-- ============ interview_messages：通过 session 归属校验 ============
alter table interview_messages enable row level security;

create policy "own_interview_messages_via_session" on interview_messages
  for all using (
    exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- ============ ai_usage：本人可查自己的用量；写入仅后端（service key） ============
alter table ai_usage enable row level security;

create policy "own_ai_usage_read" on ai_usage
  for select using (auth.uid() = user_id);

-- 注意：不给 authenticated 写策略 → 前端 anon key 写不进来，
-- 记账只能由后端 service key 完成，防止前端伪造用量。

-- ============ jd_library：公开内容人人可读，写仅 admin ============
alter table jd_library enable row level security;

create policy "public_read_jd_library" on jd_library
  for select using (is_public = true);

create policy "admin_write_jd_library" on jd_library
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
