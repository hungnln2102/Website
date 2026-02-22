import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface QueryProviderProps {
  children: React.ReactNode;
  client: QueryClient;
}

export function CustomQueryProvider({ children, client }: QueryProviderProps) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Re-export original for backwards compatibility if needed
export { QueryClientProvider };
