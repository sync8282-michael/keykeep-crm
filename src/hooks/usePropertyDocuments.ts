import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";

export interface PropertyDocument {
  id: string;
  user_id: string;
  property_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export function usePropertyDocuments(propertyId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["property-documents", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PropertyDocument[];
    },
    enabled: !!user && !!propertyId,
  });
}

export function useUploadPropertyDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      propertyId,
      file,
    }: {
      propertyId: string;
      file: File;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const filePath = `${user.id}/${propertyId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("property-documents")
        .getPublicUrl(filePath);

      // Save document record
      const { data, error } = await supabase
        .from("property_documents")
        .insert({
          user_id: user.id,
          property_id: propertyId,
          name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PropertyDocument;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["property-documents", variables.propertyId],
      });
    },
  });
}

export function useDeletePropertyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      propertyId,
      fileUrl,
    }: {
      id: string;
      propertyId: string;
      fileUrl: string;
    }) => {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split("/property-documents/");
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from("property-documents").remove([filePath]);
      }

      // Delete document record
      const { error } = await supabase
        .from("property_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["property-documents", result.propertyId],
      });
    },
  });
}
