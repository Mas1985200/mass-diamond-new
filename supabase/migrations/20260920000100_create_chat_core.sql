-- ==========================================================
-- Mass Diamond
-- Chat Core Database Migration
--
-- Responsibilities:
-- - Conversations
-- - Messages
-- - Ownership constraints
-- - Indexes
-- - Row Level Security
-- - Automatic updated_at maintenance
--
-- Security model:
-- - Client-side authenticated users can access only their own
--   conversations and user messages.
-- - Assistant/system messages are intended to be written by
--   trusted server-side code using an appropriate privileged
--   database connection.
-- ==========================================================


-- ==========================================================
-- Extensions
-- ==========================================================

create extension if not exists pgcrypto;


-- ==========================================================
-- Conversations
-- ==========================================================

create table if not exists public.chat_conversations (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  title text,

  created_at timestamptz not null
    default timezone('utc', now()),

  updated_at timestamptz not null
    default timezone('utc', now()),

  constraint chat_conversations_title_length
    check (
      title is null
      or char_length(title) <= 255
    ),

  constraint chat_conversations_user_id_id_unique
    unique (user_id, id)
);


-- ==========================================================
-- Messages
-- ==========================================================

create table if not exists public.chat_messages (
  id uuid primary key
    default gen_random_uuid(),

  conversation_id uuid not null,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role text not null,

  content text not null,

  status text not null
    default 'sent',

  attachments jsonb not null
    default '[]'::jsonb,

  capability_id text,

  error_code text,

  created_at timestamptz not null
    default timezone('utc', now()),

  updated_at timestamptz not null
    default timezone('utc', now()),

  constraint chat_messages_conversation_owner_fk
    foreign key (
      user_id,
      conversation_id
    )
    references public.chat_conversations (
      user_id,
      id
    )
    on delete cascade,

  constraint chat_messages_role_check
    check (
      role in (
        'user',
        'assistant',
        'system'
      )
    ),

  constraint chat_messages_status_check
    check (
      status in (
        'sending',
        'sent',
        'streaming',
        'completed',
        'error'
      )
    ),

  constraint chat_messages_content_length_check
    check (
      char_length(content) <= 32000
    ),

  constraint chat_messages_attachments_array_check
    check (
      jsonb_typeof(attachments) = 'array'
    )
);


-- ==========================================================
-- Indexes
-- ==========================================================

create index if not exists
  chat_conversations_user_updated_idx
on public.chat_conversations (
  user_id,
  updated_at desc
);


create index if not exists
  chat_messages_conversation_created_idx
on public.chat_messages (
  conversation_id,
  created_at asc,
  id asc
);


create index if not exists
  chat_messages_user_created_idx
on public.chat_messages (
  user_id,
  created_at desc,
  id desc
);


create index if not exists
  chat_messages_capability_idx
on public.chat_messages (
  capability_id
)
where capability_id is not null;


-- ==========================================================
-- Updated-at trigger function
-- ==========================================================

create or replace function public.set_chat_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;


-- ==========================================================
-- Updated-at triggers
-- ==========================================================

drop trigger if exists
  chat_conversations_set_updated_at
on public.chat_conversations;


create trigger
  chat_conversations_set_updated_at
before update on public.chat_conversations
for each row
execute function public.set_chat_updated_at();


drop trigger if exists
  chat_messages_set_updated_at
on public.chat_messages;


create trigger
  chat_messages_set_updated_at
before update on public.chat_messages
for each row
execute function public.set_chat_updated_at();


-- ==========================================================
-- Row Level Security
-- ==========================================================

alter table public.chat_conversations
enable row level security;

alter table public.chat_messages
enable row level security;


-- ==========================================================
-- Conversation Policies
-- ==========================================================

drop policy if exists
  chat_conversations_select_own
on public.chat_conversations;


create policy
  chat_conversations_select_own
on public.chat_conversations
for select
to authenticated
using (
  user_id = (select auth.uid())
);


drop policy if exists
  chat_conversations_insert_own
on public.chat_conversations;


create policy
  chat_conversations_insert_own
on public.chat_conversations
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);


drop policy if exists
  chat_conversations_update_own
on public.chat_conversations;


create policy
  chat_conversations_update_own
on public.chat_conversations
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);


drop policy if exists
  chat_conversations_delete_own
on public.chat_conversations;


create policy
  chat_conversations_delete_own
on public.chat_conversations
for delete
to authenticated
using (
  user_id = (select auth.uid())
);


-- ==========================================================
-- Message Policies
-- ==========================================================

drop policy if exists
  chat_messages_select_own
on public.chat_messages;


create policy
  chat_messages_select_own
on public.chat_messages
for select
to authenticated
using (
  user_id = (select auth.uid())
);


drop policy if exists
  chat_messages_insert_user
on public.chat_messages;


create policy
  chat_messages_insert_user
on public.chat_messages
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'user'
);


drop policy if exists
  chat_messages_update_own
on public.chat_messages;


create policy
  chat_messages_update_own
on public.chat_messages
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
  and role = 'user'
);


drop policy if exists
  chat_messages_delete_own
on public.chat_messages;


create policy
  chat_messages_delete_own
on public.chat_messages
for delete
to authenticated
using (
  user_id = (select auth.uid())
);


-- ==========================================================
-- End of migration
-- ==========================================================
