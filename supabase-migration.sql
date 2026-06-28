-- ============================================================
--  PinkAura — Migração (rode no SQL Editor do Supabase → Run)
--  Seguro: NÃO apaga produtos nem configurações existentes.
--  Resolve:
--    1) Loja não carregava produtos (políticas de leitura pública)
--    2) Acesso master (dono) não era concedido (claim_owner com email)
--    3) Novo recurso "Produto esgotado" + mensagem especial
-- ============================================================

-- 1. Coluna "esgotado" nos produtos --------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sold_out BOOLEAN NOT NULL DEFAULT false;

-- 2. Mensagem especial de produto esgotado -------------------------
INSERT INTO public.site_config (key, value) VALUES
  ('soldOutMessage', 'Esta peça está esgotada no momento. 💗 Fale com a gente pelo WhatsApp para saber sobre reposição!')
ON CONFLICT (key) DO NOTHING;

-- 3. Correção do acesso master (dono) ------------------------------
--    O claim_owner antigo lia o e-mail de auth.users e às vezes
--    retornava NULL, quebrando o INSERT (email é NOT NULL) e deixando
--    o usuário "sem acesso". Agora o e-mail vem como parâmetro do JS.
DROP FUNCTION IF EXISTS public.claim_owner();
CREATE OR REPLACE FUNCTION public.claim_owner(p_email TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE role = 'owner') THEN
    RETURN FALSE; -- já existe dono, não pode reivindicar
  END IF;
  INSERT INTO public.admin_roles (user_id, email, role)
  VALUES (auth.uid(), p_email, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN TRUE;
END;
$$;

-- 4. Garantir leitura pública (corrige "loja vazia") ----------------
--    Se a loja não mostrava produtos, normalmente é porque o RLS está
--    ligado mas faltava a política de SELECT para o público (anon).
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "config_select" ON public.site_config;
CREATE POLICY "config_select" ON public.site_config
  FOR SELECT TO anon, authenticated USING (true);

-- Pronto! Recarregue a loja e o painel.
