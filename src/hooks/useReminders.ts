import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";

export interface Reminder {
  id: string;
  user_id: string;
  client_id: string;
  property_id: string | null;
  type: "anniversary" | "birthday" | "followup" | "custom";
  title: string;
  description: string | null;
  base_date: string;
  reminder_date: string;
  channel: "email" | "sms" | "both";
  is_recurring: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderInsert {
  client_id: string;
  property_id?: string | null;
  type: "anniversary" | "birthday" | "followup" | "custom";
  title: string;
  description?: string | null;
  base_date: string;
  reminder_date: string;
  channel?: "email" | "sms" | "both";
  is_recurring?: boolean;
}

export function useReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reminders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!user,
  });
}

export function useClientReminders(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reminders", "client", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("client_id", clientId)
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!user && !!clientId,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reminder: ReminderInsert) => {
      const { data, error } = await supabase
        .from("reminders")
        .insert({ ...reminder, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reminder> & { id: string }) => {
      const { data, error } = await supabase
        .from("reminders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useCompleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("reminders")
        .update({ is_completed: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}
