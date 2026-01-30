-- Create a table to store backup snapshots (full JSON backup of local data)
CREATE TABLE public.backup_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  backup_data jsonb NOT NULL,
  clients_count integer NOT NULL DEFAULT 0,
  reminders_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.backup_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only view their own backups
CREATE POLICY "Users can view their own backups"
ON public.backup_snapshots
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own backups
CREATE POLICY "Users can create their own backups"
ON public.backup_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own backups
CREATE POLICY "Users can delete their own backups"
ON public.backup_snapshots
FOR DELETE
USING (auth.uid() = user_id);

-- Create an index for faster queries by user
CREATE INDEX idx_backup_snapshots_user_id ON public.backup_snapshots(user_id);
CREATE INDEX idx_backup_snapshots_created_at ON public.backup_snapshots(created_at DESC);