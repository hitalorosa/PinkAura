// Cliente Supabase compartilhado por app.js e admin.js
// IMPORTANTE: o script da CDN expõe a BIBLIOTECA em window.supabase
// (que tem .createClient, mas NÃO tem .from/.auth). Aqui criamos o
// CLIENT e o publicamos de volta em window.supabase, para que os outros
// scripts (carregados separadamente) enxerguem o client — com .from/.auth —
// ao referenciar `supabase`. Sem isso, `supabase.from(...)` quebra com
// "supabase.from is not a function" e nada do banco carrega.
const SUPABASE_URL  = 'https://tfrokqfytbipjassruzj.supabase.co';
const SUPABASE_ANON = 'sb_publishable_NwAi7e-Nh8RxrjbKFCFT8A_y6aBjdn8';

const _supabaseLib    = window.supabase;
const _supabaseClient = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON);
window.supabase = _supabaseClient;
