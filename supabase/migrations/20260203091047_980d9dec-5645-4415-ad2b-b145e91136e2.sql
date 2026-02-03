-- Set REPLICA IDENTITY to FULL for reliable realtime subscriptions
ALTER TABLE public.backup_snapshots REPLICA IDENTITY FULL;