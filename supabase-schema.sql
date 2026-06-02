-- ============================================================
-- Supabase Schema for 포토메모북 (Photo Memo Book)
-- Family-based photo sharing application
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- families table
create table public.families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- family_members table
create table public.family_members (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references public.families on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique(family_id, user_id)
);

-- photos table
create table public.photos (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references public.families on delete cascade not null,
  uploaded_by uuid references auth.users not null,
  image_url text not null,
  thumbnail_url text not null,
  date timestamptz,
  lat double precision,
  lng double precision,
  address text,
  memo text default '',
  file_name text,
  weather jsonb,
  hashtags text[] default '{}',
  favorite boolean default false,
  created_at timestamptz default now()
);

-- photo_likes table
create table public.photo_likes (
  id uuid default uuid_generate_v4() primary key,
  photo_id uuid references public.photos on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  unique(photo_id, user_id)
);

-- photo_comments table
create table public.photo_comments (
  id uuid default uuid_generate_v4() primary key,
  photo_id uuid references public.photos on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- albums table
create table public.albums (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references public.families on delete cascade not null,
  name text not null,
  description text default '',
  cover_photo_id uuid references public.photos on delete set null,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- album_photos junction table
create table public.album_photos (
  album_id uuid references public.albums on delete cascade not null,
  photo_id uuid references public.photos on delete cascade not null,
  added_at timestamptz default now(),
  primary key(album_id, photo_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- family_members indexes
create index idx_family_members_family_id on public.family_members(family_id);
create index idx_family_members_user_id on public.family_members(user_id);

-- photos indexes
create index idx_photos_family_id on public.photos(family_id);
create index idx_photos_uploaded_by on public.photos(uploaded_by);
create index idx_photos_date on public.photos(date);
create index idx_photos_family_date on public.photos(family_id, date desc);

-- photo_likes indexes
create index idx_photo_likes_photo_id on public.photo_likes(photo_id);
create index idx_photo_likes_user_id on public.photo_likes(user_id);

-- photo_comments indexes
create index idx_photo_comments_photo_id on public.photo_comments(photo_id);
create index idx_photo_comments_user_id on public.photo_comments(user_id);

-- albums indexes
create index idx_albums_family_id on public.albums(family_id);

-- album_photos indexes
create index idx_album_photos_photo_id on public.album_photos(photo_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Helper function: check if current user is a member of a given family
create or replace function public.is_family_member(family_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = family_uuid
      and user_id = auth.uid()
  );
$$;

-- Helper function: check if current user is an admin of a given family
create or replace function public.is_family_admin(family_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = family_uuid
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', new.raw_user_meta_data ->> 'full_name', 'User'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- --------------------
-- profiles
-- --------------------
alter table public.profiles enable row level security;

-- Anyone authenticated can read all profiles
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can insert their own profile
create policy "profiles_insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "profiles_update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --------------------
-- families
-- --------------------
alter table public.families enable row level security;

-- Members can read families they belong to
create policy "families_select"
  on public.families for select
  to authenticated
  using (public.is_family_member(id));

-- Any authenticated user can create a family
create policy "families_insert"
  on public.families for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Only the family creator (admin) can update the family
create policy "families_update"
  on public.families for update
  to authenticated
  using (public.is_family_admin(id))
  with check (public.is_family_admin(id));

-- Only the family creator can delete the family
create policy "families_delete"
  on public.families for delete
  to authenticated
  using (auth.uid() = created_by);

-- --------------------
-- family_members
-- --------------------
alter table public.family_members enable row level security;

-- Members can see other members in their families
create policy "family_members_select"
  on public.family_members for select
  to authenticated
  using (public.is_family_member(family_id));

-- Users can join a family (insert themselves)
create policy "family_members_insert"
  on public.family_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Admin can update member roles within their family
create policy "family_members_update"
  on public.family_members for update
  to authenticated
  using (public.is_family_admin(family_id));

-- Members can leave (delete themselves), admins can remove members
create policy "family_members_delete"
  on public.family_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_family_admin(family_id)
  );

-- --------------------
-- photos
-- --------------------
alter table public.photos enable row level security;

-- Family members can view photos in their family
create policy "photos_select"
  on public.photos for select
  to authenticated
  using (public.is_family_member(family_id));

-- Family members can upload photos to their family
create policy "photos_insert"
  on public.photos for insert
  to authenticated
  with check (
    auth.uid() = uploaded_by
    and public.is_family_member(family_id)
  );

-- Photo uploader or family admin can update the photo
create policy "photos_update"
  on public.photos for update
  to authenticated
  using (
    auth.uid() = uploaded_by
    or public.is_family_admin(family_id)
  )
  with check (public.is_family_member(family_id));

-- Only the uploader or family admin can delete a photo
create policy "photos_delete"
  on public.photos for delete
  to authenticated
  using (
    auth.uid() = uploaded_by
    or public.is_family_admin(family_id)
  );

-- --------------------
-- photo_likes
-- --------------------
alter table public.photo_likes enable row level security;

-- Family members can see likes on photos in their family
create policy "photo_likes_select"
  on public.photo_likes for select
  to authenticated
  using (
    exists (
      select 1 from public.photos
      where photos.id = photo_likes.photo_id
        and public.is_family_member(photos.family_id)
    )
  );

-- Family members can like photos in their family
create policy "photo_likes_insert"
  on public.photo_likes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.photos
      where photos.id = photo_likes.photo_id
        and public.is_family_member(photos.family_id)
    )
  );

-- Users can remove their own likes
create policy "photo_likes_delete"
  on public.photo_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- --------------------
-- photo_comments
-- --------------------
alter table public.photo_comments enable row level security;

-- Family members can see comments on photos in their family
create policy "photo_comments_select"
  on public.photo_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.photos
      where photos.id = photo_comments.photo_id
        and public.is_family_member(photos.family_id)
    )
  );

-- Family members can comment on photos in their family
create policy "photo_comments_insert"
  on public.photo_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.photos
      where photos.id = photo_comments.photo_id
        and public.is_family_member(photos.family_id)
    )
  );

-- Only the comment author can update their comment
create policy "photo_comments_update"
  on public.photo_comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only the comment author can delete their comment
create policy "photo_comments_delete"
  on public.photo_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- --------------------
-- albums
-- --------------------
alter table public.albums enable row level security;

-- Family members can view albums in their family
create policy "albums_select"
  on public.albums for select
  to authenticated
  using (public.is_family_member(family_id));

-- Family members can create albums in their family
create policy "albums_insert"
  on public.albums for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and public.is_family_member(family_id)
  );

-- Album creator or family admin can update the album
create policy "albums_update"
  on public.albums for update
  to authenticated
  using (
    auth.uid() = created_by
    or public.is_family_admin(family_id)
  )
  with check (public.is_family_member(family_id));

-- Album creator or family admin can delete the album
create policy "albums_delete"
  on public.albums for delete
  to authenticated
  using (
    auth.uid() = created_by
    or public.is_family_admin(family_id)
  );

-- --------------------
-- album_photos
-- --------------------
alter table public.album_photos enable row level security;

-- Family members can view album-photo associations
create policy "album_photos_select"
  on public.album_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.albums
      where albums.id = album_photos.album_id
        and public.is_family_member(albums.family_id)
    )
  );

-- Family members can add photos to albums in their family
create policy "album_photos_insert"
  on public.album_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.albums
      where albums.id = album_photos.album_id
        and public.is_family_member(albums.family_id)
    )
  );

-- Family members can remove photos from albums in their family
create policy "album_photos_delete"
  on public.album_photos for delete
  to authenticated
  using (
    exists (
      select 1 from public.albums
      where albums.id = album_photos.album_id
        and public.is_family_member(albums.family_id)
    )
  );

-- ============================================================
-- STORAGE BUCKET POLICIES
-- ============================================================

-- Create the photos storage bucket (run this in SQL editor or via Dashboard)
-- Note: Bucket creation is typically done via Dashboard, but the policy SQL is:

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760, -- 10MB max file size
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- Storage policy: authenticated users can upload to their own folder
create policy "storage_photos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: anyone can view photos (bucket is public)
create policy "storage_photos_select"
  on storage.objects for select
  to public
  using (bucket_id = 'photos');

-- Storage policy: users can update their own uploaded files
create policy "storage_photos_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: users can delete their own uploaded files
create policy "storage_photos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
