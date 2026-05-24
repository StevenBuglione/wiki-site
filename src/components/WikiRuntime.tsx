import React, { useEffect, useMemo, useState } from "react";
import Layout from "@theme/Layout";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { loadAllManifests, loadWikiPage, makeWikiUrl, resolveAssetUrl, resolveLinkUrl } from "../wiki-core/registry";
import type { LoadedWikiPage, ManifestPage } from "../wiki-core/types";
import styles from "./WikiRuntime.module.css";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripFrontmatter(markdown: string): string {
  return markdown.startsWith("---\n") ? markdown.replace(/^---\n[\s\S]*?\n---\n?/, "") : markdown;
}

function useQueryRoute() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  return {
    sourceId: params.get("s") || "devops",
    slug: params.get("p") || "index",
  };
}

export function WikiApp() {
  const route = useQueryRoute();
  const [data, setData] = useState<LoadedWikiPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    loadWikiPage(route.sourceId, route.slug)
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [route.sourceId, route.slug]);

  if (error) {
    return <Layout title="Wiki"><main className={styles.shell}><p className={styles.error}>{error}</p></main></Layout>;
  }
  if (!data) {
    return <Layout title="Wiki"><main className={styles.shell}><p>Loading wiki...</p></main></Layout>;
  }

  const pages = data.manifest.pages;
  return (
    <Layout title={data.page.title}>
      <main className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Wiki pages">
          <div className={styles.source}>{data.source.label}</div>
          {pages.map(page => (
            <a key={page.id} className={page.id === data.page.id ? styles.activePage : styles.pageLink} href={makeWikiUrl(page)}>
              {page.title}
            </a>
          ))}
        </aside>
        <article className={styles.article}>
          <div className={styles.meta}>
            <span>{data.page.facets?.status ?? "draft"}</span>
            <span>{data.page.review?.confidence ?? "medium"} confidence</span>
            <span>verified {String(data.page.review?.last_verified ?? "unknown")}</span>
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
            {stripFrontmatter(data.markdown)}
          </ReactMarkdown>
          <div className={styles.tags}>
            {data.page.tags.map(tag => <span key={tag}>{tag}</span>)}
          </div>
        </article>
        <aside className={styles.toc} aria-label="Page table of contents">
          <div className={styles.tocTitle}>On This Page</div>
          {(data.page.headings ?? []).map(heading => (
            <a key={heading.anchor} href={`#${heading.anchor}`} style={{ paddingLeft: `${Math.max(0, heading.depth - 1) * 10}px` }}>
              {heading.text}
            </a>
          ))}
          {data.page.editUrl ? <a className={styles.editLink} href={data.page.editUrl}>Edit on GitHub</a> : null}
        </aside>
      </main>
    </Layout>
  );
}

export function SearchApp() {
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<Array<ManifestPage & { sourceLabel: string }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllManifests()
      .then(items => {
        setPages(items.flatMap(item => item.manifest.pages.map(page => ({ ...page, sourceLabel: item.source.label }))));
      })
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const results = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return pages;
    return pages.filter(page =>
      [page.title, page.description, page.sourceLabel, ...(page.tags ?? [])].join(" ").toLowerCase().includes(needle),
    );
  }, [pages, query]);

  return (
    <Layout title="Search">
      <main className={styles.searchShell}>
        <h1>Search</h1>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search wiki pages" className={styles.searchInput} />
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.results}>
          {results.map(page => (
            <a key={page.id} href={makeWikiUrl(page)} className={styles.result}>
              <span>{page.title}</span>
              <small>{page.sourceLabel} / {page.slug}</small>
              <p>{page.description}</p>
            </a>
          ))}
        </div>
      </main>
    </Layout>
  );
}
