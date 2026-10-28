BEGIN;
CREATE TABLE IF NOT EXISTS public.media_assets (
  object_key text PRIMARY KEY,
  url text NOT NULL UNIQUE,
  content_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','ready','deleted')),
  protected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.media_cleanup_jobs (
  url text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_cleanup_due_idx ON public.media_cleanup_jobs(next_attempt_at);

CREATE OR REPLACE FUNCTION public.product_media_urls(record jsonb) RETURNS SETOF text
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT DISTINCT matched[1] FROM regexp_matches(
    concat_ws(' ',record->>'image_front',record->>'image_detail',record->>'gallery',record->>'color_variants'),
    'https://cdn[.]mangeshmahadev[.]com/[-A-Za-z0-9_./]+','g') AS matched
$fn$;

CREATE OR REPLACE FUNCTION public.product_media_lifecycle() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE before_record jsonb; after_record jsonb; asset_url text; asset_state text;
BEGIN
  IF TG_OP <> 'INSERT' THEN before_record := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN after_record := to_jsonb(NEW); END IF;
  -- The worker takes the same locks. A new reference cannot race object deletion.
  FOR asset_url IN
    SELECT u FROM public.product_media_urls(before_record) AS u
    UNION SELECT u FROM public.product_media_urls(after_record) AS u ORDER BY 1
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(asset_url, 741029));
  END LOOP;
  FOR asset_url IN SELECT u FROM public.product_media_urls(after_record) AS u LOOP
    SELECT state INTO asset_state FROM public.media_assets WHERE url=asset_url;
    IF asset_state IS DISTINCT FROM 'ready' THEN
      RAISE EXCEPTION 'Product image is unavailable or upload is incomplete' USING ERRCODE='23514';
    END IF;
  END LOOP;
  FOR asset_url IN
    SELECT u FROM public.product_media_urls(before_record) AS u
    EXCEPT SELECT u FROM public.product_media_urls(after_record) AS u
  LOOP
    INSERT INTO public.media_cleanup_jobs(url,next_attempt_at) VALUES(asset_url,now()+interval '15 seconds')
    ON CONFLICT(url) DO UPDATE SET attempts=0,next_attempt_at=excluded.next_attempt_at,last_error=NULL;
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS product_media_lifecycle_trigger ON public.products;
CREATE TRIGGER product_media_lifecycle_trigger BEFORE INSERT OR UPDATE OF image_front,image_detail,gallery,color_variants OR DELETE
ON public.products FOR EACH ROW EXECUTE FUNCTION public.product_media_lifecycle();
GRANT SELECT,INSERT,UPDATE,DELETE ON public.media_assets,public.media_cleanup_jobs TO mangesh_app;
COMMIT;
