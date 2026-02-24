-- =============================================
-- 다이어리를 하나만 사자 - DB 마이그레이션
-- Supabase 대시보드 > SQL Editor에서 실행
-- =============================================

-- 1. profiles 테이블 (사용자 프로필)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. posts 테이블 (게시물)
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. post_images 테이블 (게시물 이미지)
CREATE TABLE IF NOT EXISTS public.post_images (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. comments 테이블 (댓글)
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. likes 테이블 (좋아요)
CREATE TABLE IF NOT EXISTS public.likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- updated_at 자동 업데이트 트리거
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 신규 유저 가입 시 profiles 자동 생성 트리거
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS (Row Level Security) 활성화
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- profiles 정책
CREATE POLICY "누구나 프로필 조회 가능" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필만 수정 가능" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- posts 정책
CREATE POLICY "누구나 게시물 조회 가능" ON public.posts FOR SELECT USING (true);
CREATE POLICY "로그인한 사용자만 게시물 작성" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 게시물만 수정 가능" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 게시물만 삭제 가능" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- post_images 정책
CREATE POLICY "누구나 이미지 조회 가능" ON public.post_images FOR SELECT USING (true);
CREATE POLICY "본인 게시물 이미지 등록" ON public.post_images FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id)
);
CREATE POLICY "본인 게시물 이미지 삭제" ON public.post_images FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id)
);

-- comments 정책
CREATE POLICY "누구나 댓글 조회 가능" ON public.comments FOR SELECT USING (true);
CREATE POLICY "로그인한 사용자만 댓글 작성" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 댓글만 삭제 가능" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- likes 정책
CREATE POLICY "누구나 좋아요 조회 가능" ON public.likes FOR SELECT USING (true);
CREATE POLICY "로그인한 사용자만 좋아요" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 좋아요만 취소 가능" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Storage 버킷 생성 (이미지 업로드용)
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "누구나 이미지 조회" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "로그인 사용자 이미지 업로드" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "본인 이미지 삭제" ON storage.objects FOR DELETE USING (
  bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
