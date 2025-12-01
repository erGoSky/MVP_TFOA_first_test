export interface ResourceMetadata {
  name: string;
  category: string;
  icon: string;
  color: string;
  edible?: boolean;
  nutrition?: number;
  craftingMaterial?: boolean;
  value: number;
}

export interface BiomeMetadata {
  name: string;
  color: string;
  description: string;
}

export interface WorkstationMetadata {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface EntitiesMetadata {
  resourceTypes: Record<string, string>;
  resourceMetadata: Record<string, ResourceMetadata>;
  biomeMetadata: Record<string, BiomeMetadata>;
  containerTypes: Record<string, string>;
  workstationTypes: Record<string, string>;
  workstationMetadata: Record<string, WorkstationMetadata>;
}
