-- 0001_init.sql · 表结构与索引（对应 docs/ARCHITECTURE.md §6.1–6.2）
-- 执行方式：Supabase Dashboard → SQL Editor 粘贴执行，或 supabase db push
-- 约定：一律 timestamptz；所有业务表 user_id 非空（jd_library 除外）

-- ============ 扩展 ============
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============ profiles：用户扩展表，与 auth.users 1:1 ============
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade, -- = auth.uid()
  email      text,
  nickname   text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  status     text not null default 'active',
  created_at timestamptz not null default now()
);

-- ============ resumes：一份简历一行 ============
create table resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  raw_content text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz -- 软删除：非 null 即已归档
);

-- ============ resume_versions：改写历史（改坏了能回滚） ============
create table resume_versions (
  id             uuid primary key default gen_random_uuid(),
  resume_id      uuid not null references resumes (id) on delete cascade,
  content        text not null,
  source         text not null check (source in ('manual', 'ai_rewrite')),
  prompt_version text,
  created_at     timestamptz not null default now()
);

-- ============ job_jds ============
create table job_jds (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  company        text,
  raw_text       text not null,
  require_skills jsonb not null default '[]', -- LLM 结构化后落库
  created_at     timestamptz not null default now()
);

-- ============ match_results：落库才能做"改完再看分数变化"闭环 ============
create table match_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  resume_version_id uuid not null references resume_versions (id) on delete cascade,
  jd_id             uuid not null references job_jds (id) on delete cascade,
  score             int check (score between 0 and 100),
  dimensions        jsonb,
  strengths         jsonb,
  gaps              jsonb,
  suggestions       jsonb,
  model             text,
  prompt_version    text,
  created_at        timestamptz not null default now()
);

-- ============ interview_sessions ============
create table interview_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  resume_version_id uuid references resume_versions (id) on delete set null,
  jd_id             uuid references job_jds (id) on delete set null,
  status            text not null default 'active' check (status in ('active', 'ended')),
  summary           jsonb,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz
);

-- ============ interview_messages：seq 保序，(session_id, seq) 唯一 ============
create table interview_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'agent')),
  content    text not null,
  seq        int not null,
  created_at timestamptz not null default now(),
  unique (session_id, seq)
);

-- ============ ai_usage：配额判定 + 成本核算 ============
create table ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade, -- 游客为 null
  device_id  text,                                              -- 游客按 deviceId 记账
  task       text not null,                                     -- analyze / rewrite / agent / interview_turn / interview_summary
  tokens_in  int not null default 0,
  tokens_out int not null default 0,
  latency_ms int,
  status     text not null default 'ok',
  created_at timestamptz not null default now()
);

-- ============ jd_library：内置示例库，admin 写、所有人读 ============
create table jd_library (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  company    text,
  raw_text   text not null,
  tags       text[] not null default '{}',
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ updated_at 自动维护 ============
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_resumes_updated_at
  before update on resumes
  for each row execute function set_updated_at();

-- ============ 索引（§6.2） ============
create index idx_resumes_user        on resumes (user_id, created_at desc);
create index idx_resume_versions_rid on resume_versions (resume_id, created_at desc);
create index idx_job_jds_user        on job_jds (user_id, created_at desc);
create index idx_match_results_user  on match_results (user_id, jd_id, created_at desc);
create index idx_sessions_user       on interview_sessions (user_id, started_at desc);
create index idx_messages_session    on interview_messages (session_id, seq);
create index idx_ai_usage_user       on ai_usage (user_id, created_at desc);
create index idx_ai_usage_device     on ai_usage (device_id, created_at desc) where user_id is null;
