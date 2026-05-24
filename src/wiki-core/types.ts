export interface RegistrySource {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  order: number;
  latestUrl: string;
}

export interface WikiRegistry {
  schemaVersion: "steve-wiki-registry/v1";
  updatedAt: string;
  routeMode: "query";
  sources: RegistrySource[];
}

export interface SourceLatest {
  schemaVersion: "steve-wiki-latest/v1";
  sourceId: string;
  sourceCommit: string;
  generatedAt: string;
  artifactBaseUrl: string;
  manifestUrl: string;
  catalogUrl: string;
  tagsUrl?: string;
  graphUrl?: string;
  healthUrl?: string;
  pagefindBundleUrl?: string;
  agentManifestUrl?: string;
  contentBaseUrl: string;
  assetsBaseUrl: string;
}

export interface ManifestPage {
  id: string;
  sourceId: string;
  title: string;
  description?: string;
  slug: string;
  file: string;
  tags: string[];
  facets: Record<string, string>;
  review?: Record<string, string | boolean>;
  aliases?: string[];
  updatedAt?: string;
  editUrl?: string;
  headings?: Array<{ depth: number; text: string; anchor: string }>;
}

export interface WikiManifest {
  schemaVersion: "steve-wiki-manifest/v1";
  source: { id: string; label: string; sourceCommit: string };
  contentBaseUrl: string;
  assetsBaseUrl: string;
  pages: ManifestPage[];
  sidebar: Array<{ type: string; label: string; items: string[] }>;
}

export interface LoadedWikiPage {
  source: RegistrySource;
  latest: SourceLatest;
  manifest: WikiManifest;
  page: ManifestPage;
  markdown: string;
}
