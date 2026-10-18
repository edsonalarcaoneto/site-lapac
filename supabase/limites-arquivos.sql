-- =====================================================================
-- Limites do espaço de arquivos (bucket "arquivos")
-- Rode uma vez: Supabase → SQL Editor → New query → colar → Run. Pode rodar de novo sem problema.
--
-- O que muda:
-- - Só entram fotos em JPEG e PDFs. O site já converte toda foto para JPEG antes de enviar,
--   então nada muda para quem usa o painel.
-- - Cada arquivo pode ter até 45 MB, o mesmo limite que o site mostra para os PDFs.
-- Isso evita que um arquivo grande enviado por engano (um vídeo, por exemplo) encha o 1 GB do plano
-- grátis, e que entre no site um tipo de arquivo que o painel nunca envia.
-- =====================================================================

update storage.buckets
set file_size_limit    = 47185920,  -- 45 MB
    allowed_mime_types = array['image/jpeg', 'application/pdf']
where id = 'arquivos';

-- Para conferir: deve mostrar 47185920 e {image/jpeg,application/pdf}
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'arquivos';
