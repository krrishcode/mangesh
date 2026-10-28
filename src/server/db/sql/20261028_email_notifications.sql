BEGIN;

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id varchar(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_key varchar(255) NOT NULL UNIQUE,
  kind varchar(64) NOT NULL CHECK (kind IN ('welcome','order_placed','appointment_booked','appointment_rescheduled','appointment_cancelled')),
  recipient varchar(255) NOT NULL,
  payload jsonb NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  lock_token varchar(64),
  last_error varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS email_outbox_pending_idx ON public.email_outbox(status, next_attempt_at);

CREATE OR REPLACE FUNCTION public.mm_enqueue_email(p_schema text, p_key text, p_kind text, p_recipient text, p_payload jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_schema NOT IN ('public', 'mangesh_qa') OR p_recipient IS NULL OR p_recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RETURN; END IF;
  EXECUTE format('INSERT INTO %I.email_outbox(event_key,kind,recipient,payload) VALUES ($1,$2,$3,$4) ON CONFLICT(event_key) DO NOTHING',p_schema)
    USING p_key,p_kind,p_recipient,p_payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.mm_capture_customer_email()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  data jsonb;
  recipient_email text;
  support_email text;
  event_kind text;
  event_key text;
BEGIN
  IF TG_TABLE_SCHEMA NOT IN ('public', 'mangesh_qa') THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.role <> 'customer' THEN RETURN NEW; END IF;
    data := jsonb_build_object('name',NEW.name,'email',NEW.email);
    PERFORM public.mm_enqueue_email(TG_TABLE_SCHEMA,'welcome:' || NEW.id,'welcome',NEW.email,data);
    RETURN NEW;
  END IF;

  EXECUTE format('SELECT value FROM %I.admin_settings WHERE setting_key = ''support_email'' LIMIT 1',TG_TABLE_SCHEMA) INTO support_email;
  support_email := coalesce(nullif(support_email,''),'support@mangeshmahadev.com');

  IF TG_TABLE_NAME = 'orders' THEN
    -- Deferred until commit: guest details, checkout snapshot and line items exist.
    EXECUTE format('SELECT jsonb_build_object(''name'',coalesce(u.name,g.name),''email'',coalesce(u.email,g.email),''orderId'',o.id,''guest'',o.user_id IS NULL,''total'',o.total_amount::text,''fulfilment'',d.fulfilment,''shippingAddress'',d.shipping_address,''items'',coalesce((SELECT jsonb_agg(jsonb_build_object(''title'',i.title,''quantity'',i.quantity,''price'',i.price::text,''size'',v.size,''color'',v.color) ORDER BY i.id) FROM %1$I.order_items i LEFT JOIN %1$I.order_item_variants v ON v.order_item_id=i.id WHERE i.order_id=o.id),''[]''::jsonb)) FROM %1$I.orders o LEFT JOIN %1$I.users u ON u.id=o.user_id LEFT JOIN %1$I.guest_order_details g ON g.order_id=o.id LEFT JOIN %1$I.order_checkout_details d ON d.order_id=o.id WHERE o.id=$1',TG_TABLE_SCHEMA)
      INTO data USING NEW.id;
    event_kind := 'order_placed';
    event_key := 'order:' || NEW.id || ':placed';
  ELSIF TG_TABLE_NAME = 'appointments' THEN
    IF TG_OP = 'INSERT' THEN
      event_kind := 'appointment_booked';
      event_key := 'appointment:' || NEW.id || ':booked';
    ELSIF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
      event_kind := 'appointment_cancelled';
      event_key := 'appointment:' || NEW.id || ':cancelled';
    ELSIF NEW.status = 'upcoming' AND (OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at OR OLD.location IS DISTINCT FROM NEW.location OR OLD.occasion IS DISTINCT FROM NEW.occasion) THEN
      event_kind := 'appointment_rescheduled';
      event_key := 'appointment:' || NEW.id || ':rescheduled:' || txid_current() || ':' || md5(NEW.scheduled_at::text || NEW.location || NEW.occasion);
    ELSE
      RETURN NEW;
    END IF;
    EXECUTE format('SELECT jsonb_build_object(''name'',name,''email'',email,''appointmentId'',$1,''location'',$2,''occasion'',$3,''scheduledAt'',$4) FROM %I.users WHERE id=$5',TG_TABLE_SCHEMA)
      INTO data USING NEW.id,NEW.location,NEW.occasion,to_char(NEW.scheduled_at,'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),NEW.user_id;
  END IF;
  recipient_email := data->>'email';
  PERFORM public.mm_enqueue_email(TG_TABLE_SCHEMA,event_key || ':customer',event_kind,recipient_email,data);
  IF recipient_email IS NOT NULL AND lower(recipient_email) <> lower(support_email) THEN
    PERFORM public.mm_enqueue_email(TG_TABLE_SCHEMA,event_key || ':staff',event_kind,support_email,data || '{"staff":true}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['public','mangesh_qa'] LOOP
    IF to_regclass(format('%I.users',s)) IS NULL THEN CONTINUE; END IF;
    IF s <> 'public' THEN
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I.email_outbox (LIKE public.email_outbox INCLUDING ALL)',s);
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS mm_user_welcome ON %I.users',s);
    EXECUTE format('CREATE CONSTRAINT TRIGGER mm_user_welcome AFTER INSERT ON %I.users DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.mm_capture_customer_email()',s);
    EXECUTE format('DROP TRIGGER IF EXISTS mm_order_placed ON %I.orders',s);
    EXECUTE format('CREATE CONSTRAINT TRIGGER mm_order_placed AFTER INSERT ON %I.orders DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.mm_capture_customer_email()',s);
    EXECUTE format('DROP TRIGGER IF EXISTS mm_appointment_email ON %I.appointments',s);
    EXECUTE format('CREATE TRIGGER mm_appointment_email AFTER INSERT OR UPDATE ON %I.appointments FOR EACH ROW EXECUTE FUNCTION public.mm_capture_customer_email()',s);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I.email_outbox TO mangesh_app',s);
  END LOOP;
END;
$$;

COMMIT;
