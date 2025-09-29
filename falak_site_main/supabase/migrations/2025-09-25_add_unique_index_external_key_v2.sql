-- Ensure the external_key_v2 column exists
ALTER TABLE IF EXISTS public.external_pass_map
ADD COLUMN IF NOT EXISTS external_key_v2 text;

-- Optional: ensure legacy key has a unique index as well (harmless if it already exists)
CREATE UNIQUE INDEX IF NOT EXISTS uq_external_pass_map_external_key
ON public.external_pass_map (external_key);

-- Create a UNIQUE index so ON CONFLICT (external_key_v2) works
-- Note: Postgres UNIQUE allows multiple NULLs, so rows with NULL external_key_v2 are fine
CREATE UNIQUE INDEX IF NOT EXISTS uq_external_pass_map_external_key_v2
ON public.external_pass_map (external_key_v2);

-- Diagnostics helpers (copy/paste to SQL editor to run manually):
-- List duplicates that would block the unique index creation
-- SELECT external_key_v2, COUNT(*)
-- FROM public.external_pass_map
-- WHERE external_key_v2 IS NOT NULL
-- GROUP BY 1
-- HAVING COUNT(*) > 1;

-- Optionally, if you want case-insensitive uniqueness at the DB layer, use a functional index instead
-- (only do this if your app always lowercases before writing and reading with the same function):
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_external_pass_map_lower_external_key_v2
-- ON public.external_pass_map ((lower(external_key_v2)));
-- In that case, switch application upserts to: onConflict: 'lower(external_key_v2)'
-- BUT most client libraries (including supabase-js) do not support expression targets in onConflict.
-- So prefer the plain column unique index and normalize to lowercase in the app as we do today.
