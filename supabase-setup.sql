-- ============================================================
--  PinkAura — Setup inicial do Supabase
--  Cole este SQL no editor SQL do painel Supabase e clique em Run
-- ============================================================

-- 1. Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT    NOT NULL,
  category        TEXT    NOT NULL,
  price           TEXT,
  price_original  TEXT,
  description     TEXT,
  colors          JSONB   DEFAULT '[]'::jsonb,
  sizes           TEXT[]  DEFAULT '{}',
  images          TEXT[]  DEFAULT '{}',
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de configurações do site (chave-valor)
CREATE TABLE IF NOT EXISTS public.site_config (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO public.site_config (key, value) VALUES
  ('whatsapp',        '5511999999999'),
  ('heroTag',         'Nova Coleção'),
  ('heroTitle',       'Moda feminina com muito estilo'),
  ('heroSubtitle',    'Cultive sua energia'),
  ('catalogTitle',    'Nossa Vitrine'),
  ('catalogSubtitle', 'Clique em uma peça para ver detalhes'),
  ('footerFrase',     'Moda feminina com alma. Fale conosco pelo WhatsApp.')
ON CONFLICT (key) DO NOTHING;

-- 3. Tabela de papéis de administrador
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  invited_by_id UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Funções auxiliares (SECURITY DEFINER evita recursão no RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_owner()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE role = 'owner');
$$;

CREATE OR REPLACE FUNCTION public.claim_owner()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE role = 'owner') THEN
    RETURN FALSE; -- já existe dono, não pode reivindicar
  END IF;
  INSERT INTO public.admin_roles (user_id, email, role)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), 'owner')
  ON CONFLICT DO NOTHING;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_invited(check_email TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_invites WHERE email = lower(check_email));
$$;

-- 6. Trigger: primeiro usuário vira dono, convidados viram admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE role = 'owner') THEN
    INSERT INTO public.admin_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'owner');
  ELSIF EXISTS (SELECT 1 FROM public.admin_invites WHERE email = lower(NEW.email)) THEN
    INSERT INTO public.admin_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'admin');
    DELETE FROM public.admin_invites WHERE email = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Ativar RLS em todas as tabelas
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de produtos (leitura pública, escrita só admin)
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin());

-- 9. Políticas de configurações (leitura pública, escrita só admin)
DROP POLICY IF EXISTS "config_select" ON public.site_config;
CREATE POLICY "config_select" ON public.site_config
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "config_upsert" ON public.site_config;
CREATE POLICY "config_upsert" ON public.site_config
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "config_update" ON public.site_config;
CREATE POLICY "config_update" ON public.site_config
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 10. Políticas de papéis (admins lêem, dono revoga)
DROP POLICY IF EXISTS "roles_select" ON public.admin_roles;
CREATE POLICY "roles_select" ON public.admin_roles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "roles_delete" ON public.admin_roles;
CREATE POLICY "roles_delete" ON public.admin_roles
  FOR DELETE TO authenticated USING (public.is_owner() AND user_id != auth.uid());

-- 11. Políticas de convites (só dono gerencia)
DROP POLICY IF EXISTS "invites_select" ON public.admin_invites;
CREATE POLICY "invites_select" ON public.admin_invites
  FOR SELECT TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "invites_insert" ON public.admin_invites;
CREATE POLICY "invites_insert" ON public.admin_invites
  FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "invites_delete" ON public.admin_invites;
CREATE POLICY "invites_delete" ON public.admin_invites
  FOR DELETE TO authenticated USING (public.is_owner());

-- 12. Bucket de imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_select" ON storage.objects;
CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images' AND public.is_admin()
  );

DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'product-images' AND public.is_admin()
  );
