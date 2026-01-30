import { useLiveQuery } from 'dexie-react-hooks';
import { db, Client, generateId } from '@/db/database';
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useLocalClients() {
  const clients = useLiveQuery(() => 
    db.clients.orderBy('createdAt').reverse().toArray()
  ) ?? [];

  const isLoading = clients === undefined;

  return { clients, isLoading };
}

export function useLocalClient(id: string | undefined) {
  const client = useLiveQuery(
    () => (id ? db.clients.get(id) : undefined),
    [id]
  );

  return { client, isLoading: client === undefined };
}

export function useClientMutations() {
  const createClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = generateId();
    
    await db.clients.add({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    });

    toast({
      title: "Client Saved",
      description: `${data.name} has been added successfully.`,
    });

    return id;
  }, []);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    await db.clients.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: "Client Updated",
      description: "Changes saved successfully.",
    });
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await db.clients.delete(id);

    toast({
      title: "Client Deleted",
      description: "Client has been removed.",
    });
  }, []);

  return { createClient, updateClient, deleteClient };
}

// Search clients by name or address
export function useClientSearch(query: string) {
  const clients = useLiveQuery(
    async () => {
      if (!query.trim()) {
        return db.clients.orderBy('createdAt').reverse().toArray();
      }
      
      const lowerQuery = query.toLowerCase();
      const allClients = await db.clients.toArray();
      
      return allClients.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.address.toLowerCase().includes(lowerQuery)
      );
    },
    [query]
  ) ?? [];

  return { clients, isLoading: clients === undefined };
}
