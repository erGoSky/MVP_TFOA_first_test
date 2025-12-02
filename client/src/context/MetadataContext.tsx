import React, { createContext, useContext, useEffect, useState } from "react";
import type { EntitiesMetadata } from "../types/metadata";

interface MetadataContextType extends EntitiesMetadata {
  loading: boolean;
  error: string | null;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export const MetadataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metadata, setMetadata] = useState<EntitiesMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch("/meta/entities"); // Proxy handles localhost:3000
        if (!response.ok) throw new Error("Failed to fetch metadata");
        const data = await response.json();
        setMetadata(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const value: MetadataContextType = {
    resourceTypes: metadata?.resourceTypes || {},
    resourceMetadata: metadata?.resourceMetadata || {},
    biomeMetadata: metadata?.biomeMetadata || {},
    containerTypes: metadata?.containerTypes || {},
    workstationTypes: metadata?.workstationTypes || {},
    workstationMetadata: metadata?.workstationMetadata || {},
    loading,
    error,
  };

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
};

export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error("useMetadata must be used within a MetadataProvider");
  }
  return context;
};
