import Layout from "@theme/Layout";
import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import {
  loadedPageForAgent,
  searchWiki,
  stripFrontmatter,
  type LoadedManifestSet,
  type WikiSearchResult,
} from "../wiki-core/agentTools";
import {
  loadAllManifests,
  loadWikiPage,
  makeWikiUrl,
  registryUrl,
  resolveAssetUrl,
  resolveLinkUrl,
} from "../wiki-core/registry";
import type { LoadedWikiPage, ManifestPage } from "../wiki-core/types";
import { registerWikiWebMcpTools, wikiWebMcpToolNames } from "../webmcp/registerTools";
import styles from "./WikiRuntime.module.css";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function useQueryRoute() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  return {
    sourceId: params.get("s") || "devops",
    slug: params.get("p") || "index",
  };
}

function useAgentTools() {
  const [status, setStatus] = useState<{ supported: boolean; registered: string[]; fallback: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    registerWikiWebMcpTools()
      .then(result => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus({ supported: false, registered: [], fallback: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}

function goToSource(sourceId: string, manifests: LoadedManifestSet) {
  const source = manifests.find(item => item.source.id === sourceId);
  const page = source?.manifest.pages.find(item => item.slug === "index") ?? source?.manifest.pages[0];
  if (page) window.location.href = makeWikiUrl(page);
}

async function copyText(value: string) {
  await navigator.clipboard?.writeText(value);
}

function sourceRepoUrl(sourceId: string) {
  return `https://github.com/StevenBuglione/wiki-data-${sourceId}`;
}

function sourceCommitUrl(sourceId: string, commit: string) {
  return `${sourceRepoUrl(sourceId)}/tree/${commit}`;
}

function PageActions({ data }: { data: LoadedWikiPage }) {
  const pageUrl = typeof window === "undefined" ? makeWikiUrl(data.page) : new URL(makeWikiUrl(data.page), window.location.origin).href;
  const resource = `wiki://page/${data.source.id}/${data.page.slug}`;
  return (
    <div className={styles.actions} aria-label="Page actions">
      <button type="button" onClick={() => copyText(pageUrl)} title="Copy page URL">Copy URL</button>
      <button type="button" onClick={() => copyText(resource)} title="Copy MCP resource URI">Copy URI</button>
      <button type="button" onClick={() => copyText(loadedPageForAgent(data).markdown)} title="Copy clean Markdown">Copy MD</button>
      {data.page.editUrl ? <a href={data.page.editUrl}>Edit</a> : null}
    </div>
  );
}

function QualityPanel({ data }: { data: LoadedWikiPage }) {
  return (
    <section className={styles.infoPanel} aria-label="Page metadata">
      <div>
        <span>Status</span>
        <strong>{data.page.facets?.status ?? "draft"}</strong>
      </div>
      <div>
        <span>Review</span>
        <strong>{String(data.page.review?.review_status ?? "ai_draft")}</strong>
      </div>
      <div>
        <span>Verified</span>
        <strong>{String(data.page.review?.last_verified ?? "unknown")}</strong>
      </div>
      <div>
        <span>Source</span>
        <a href={sourceCommitUrl(data.source.id, data.latest.sourceCommit)}>{data.latest.sourceCommit.slice(0, 7)}</a>
      </div>
    </section>
  );
}

export function WikiApp() {
  const route = useQueryRoute();
  const agentStatus = useAgentTools();
  const [data, setData] = useState<LoadedWikiPage | null>(null);
  const [manifests, setManifests] = useState<LoadedManifestSet>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    setData(null);
    Promise.all([loadWikiPage(route.sourceId, route.slug), loadAllManifests()])
      .then(([page, loaded]) => {
        if (!cancelled) {
          setData(page);
          setManifests(loaded);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [route.sourceId, route.slug]);

  if (error) {
    return (
      <Layout title="Wiki">
        <main className={styles.shell}>
          <p className={styles.error}>{error}</p>
        </main>
      </Layout>
    );
  }
  if (!data) {
    return (
      <Layout title="Wiki">
        <main className={styles.loadingShell}>
          <p>Loading wiki...</p>
        </main>
      </Layout>
    );
  }

  const pages = data.manifest.pages;
  const activeSource = manifests.find(item => item.source.id === data.source.id);
  return (
    <Layout title={data.page.title}>
      <main className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Wiki pages">
          <label className={styles.controlLabel} htmlFor="source-switcher">Source</label>
          <select id="source-switcher" value={data.source.id} onChange={event => goToSource(event.target.value, manifests)}>
            {(manifests.length ? manifests : [activeSource].filter(Boolean) as LoadedManifestSet).map(item => (
              <option key={item.source.id} value={item.source.id}>{item.source.label}</option>
            ))}
          </select>
          <div className={styles.sourceDescription}>{data.source.description}</div>
          <div className={styles.navSectionTitle}>Pages</div>
          {pages.map(page => (
            <a key={page.id} className={page.id === data.page.id ? styles.activePage : styles.pageLink} href={makeWikiUrl(page)}>
              <span>{page.title}</span>
              <small>{page.facets?.status ?? "draft"}</small>
            </a>
          ))}
        </aside>
        <article className={styles.article}>
          <div className={styles.readerHeader}>
            <div>
              <div className={styles.breadcrumbs}>{data.source.label} / {data.page.slug}</div>
              <h1>{data.page.title}</h1>
              {data.page.description ? <p>{data.page.description}</p> : null}
            </div>
            <PageActions data={data} />
          </div>
          <div className={styles.meta}>
            <span>{data.page.facets?.status ?? "draft"}</span>
            <span>{String(data.page.review?.confidence ?? "medium")} confidence</span>
            <span>{data.page.facets?.difficulty ?? "beginner"}</span>
            {agentStatus?.fallback ? <span>agent tools ready</span> : null}
          </div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              h1: props => <h1 id={slugify(String(props.children ?? ""))}>{props.children}</h1>,
              h2: props => <h2 id={slugify(String(props.children ?? ""))}>{props.children}</h2>,
              h3: props => <h3 id={slugify(String(props.children ?? ""))}>{props.children}</h3>,
              h4: props => <h4 id={slugify(String(props.children ?? ""))}>{props.children}</h4>,
              h5: props => <h5 id={slugify(String(props.children ?? ""))}>{props.children}</h5>,
              h6: props => <h6 id={slugify(String(props.children ?? ""))}>{props.children}</h6>,
              a: props => (
                <a
                  {...props}
                  href={props.href ? resolveLinkUrl(data.manifest, data.source.id, data.page.file, props.href) : props.href}
                />
              ),
              img: props => (
                <img
                  {...props}
                  src={props.src ? resolveAssetUrl(data.latest, data.page.file, props.src) : props.src}
                  alt={props.alt ?? ""}
                />
              ),
            }}
          >
            {stripFrontmatter(data.markdown).replace(/^\s*#\s+.+\n/, "")}
          </ReactMarkdown>
          <div className={styles.tags}>
            {data.page.tags.map(tag => <span key={tag}>{tag}</span>)}
          </div>
        </article>
        <aside className={styles.toc} aria-label="Page table of contents">
          <QualityPanel data={data} />
          <div className={styles.tocTitle}>On This Page</div>
          {(data.page.headings ?? []).map(heading => (
            <a key={heading.anchor} href={`#${heading.anchor}`} style={{ paddingLeft: `${Math.max(0, heading.depth - 1) * 10}px` }}>
              {heading.text}
            </a>
          ))}
        </aside>
      </main>
    </Layout>
  );
}

export function SearchApp() {
  useAgentTools();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [pages, setPages] = useState<WikiSearchResult[]>([]);
  const [manifests, setManifests] = useState<LoadedManifestSet>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    loadAllManifests()
      .then(items => {
        setManifests(items);
        return searchWiki({ limit: 100 });
      })
      .then(result => setPages(result.results))
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const allTags = useMemo(() => [...new Set(pages.flatMap(page => page.tags ?? []))].sort(), [pages]);
  const results = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return pages.filter(page => {
      if (sourceId && page.sourceId !== sourceId) return false;
      if (status && page.facets.status !== status) return false;
      if (tag && !page.tags.includes(tag)) return false;
      if (!needle) return true;
      return [page.title, page.description, page.sourceLabel, page.slug, ...page.tags].join(" ").toLowerCase().includes(needle);
    });
  }, [pages, query, sourceId, status, tag]);

  return (
    <Layout title="Search">
      <main className={styles.searchShell}>
        <div className={styles.searchHeader}>
          <div>
            <h1>Search</h1>
            <p>Browse manifests from every enabled wiki source. Pagefind wiring can replace this index without changing routes.</p>
          </div>
          <a href="/wiki-site/agents/">Agent Tools</a>
        </div>
        {mounted ? (
          <div className={styles.searchControls}>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search wiki pages" className={styles.searchInput} />
            <select value={sourceId} onChange={event => setSourceId(event.target.value)} aria-label="Filter source">
              <option value="">All sources</option>
              {manifests.map(item => <option key={item.source.id} value={item.source.id}>{item.source.label}</option>)}
            </select>
            <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter status">
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="deprecated">Deprecated</option>
            </select>
            <select value={tag} onChange={event => setTag(event.target.value)} aria-label="Filter tag">
              <option value="">Any tag</option>
              {allTags.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        ) : (
          <p>Loading search...</p>
        )}
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.resultCount}>{results.length} result{results.length === 1 ? "" : "s"}</div>
        <div className={styles.results}>
          {results.map(page => (
            <a key={page.pageId} href={page.url} className={styles.result}>
              <span>{page.title}</span>
              <small>{page.sourceLabel} / {page.slug}</small>
              <p>{page.description}</p>
              <div className={styles.resultTags}>{page.tags.map(item => <em key={item}>{item}</em>)}</div>
            </a>
          ))}
        </div>
      </main>
    </Layout>
  );
}

export function AgentsApp() {
  const status = useAgentTools();
  const [probe, setProbe] = useState<unknown>(null);
  const [error, setError] = useState("");

  async function runProbe() {
    try {
      setError("");
      setProbe(await window.__wikiTools?.listSources());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Layout title="Agent Tools">
      <main className={styles.agentsShell}>
        <section className={styles.agentHero}>
          <div>
            <h1>Agent Tools</h1>
            <p>Read-only browser tools expose the same wiki-core retrieval layer used by the human UI.</p>
          </div>
          <div className={styles.agentStatus}>
            <span>{status?.supported ? "WebMCP detected" : "WebMCP not detected"}</span>
            <strong>{status?.fallback ? "Fallback tools ready" : "Initializing"}</strong>
          </div>
        </section>
        <section className={styles.toolGrid}>
          {wikiWebMcpToolNames.map(name => (
            <div key={name} className={styles.toolCard}>
              <strong>{name}</strong>
              <span>{status?.registered.includes(name) ? "registered" : "fallback"}</span>
            </div>
          ))}
        </section>
        <section className={styles.debugPanel}>
          <div>
            <h2>Debug Probe</h2>
            <p>Runs `window.__wikiTools.listSources()` so browsers without WebMCP can still verify the tool contract.</p>
          </div>
          <button type="button" onClick={runProbe}>Run Probe</button>
          {error ? <p className={styles.error}>{error}</p> : null}
          {probe ? <pre>{JSON.stringify(probe, null, 2)}</pre> : null}
        </section>
      </main>
    </Layout>
  );
}
