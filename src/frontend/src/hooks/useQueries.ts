import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';

// Placeholder for future backend integration
// Currently, all data is stored locally in IndexedDB

export function useBackendMetadata() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['metadata'],
    queryFn: async () => {
      if (!actor) return [];
      // Future: return actor.getPhotoMetadata();
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}
