import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import React from "react";

export default function HomePage() {
  return (
    <Layout title="AI Wiki">
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 24px" }}>
        <section style={{ borderBottom: "1px solid var(--ifm-color-emphasis-200)", paddingBottom: 28 }}>
          <p style={{ color: "var(--ifm-color-emphasis-700)", fontWeight: 700, marginBottom: 8 }}>
            Repo-backed knowledge system
          </p>
          <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4.8rem)", lineHeight: 1, margin: 0 }}>AI Wiki</h1>
          <p style={{ color: "var(--ifm-color-emphasis-700)", fontSize: "1.1rem", maxWidth: 720 }}>
            Runtime Markdown, generated source artifacts, issue-backed research queues, and read-only browser agent tools.
          </p>
          <p style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link className="button button--primary" to="/wiki/?s=devops&p=index">Open wiki</Link>
            <Link className="button button--secondary" to="/search">Search sources</Link>
            <Link className="button button--secondary" to="/agents">Agent tools</Link>
          </p>
        </section>
        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 24 }}>
          {[
            ["Runtime content", "The shell loads registry, latest pointers, manifests, and Markdown at runtime."],
            ["Visible research", "GitHub Issues hold the persistent queue for unattended OMG wiki work."],
            ["Agent-ready", "Static discovery plus browser tool adapters expose wiki-core retrieval functions."],
          ].map(([title, body]) => (
            <div key={title} style={{ border: "1px solid var(--ifm-color-emphasis-200)", borderRadius: 8, padding: 16 }}>
              <strong>{title}</strong>
              <p style={{ color: "var(--ifm-color-emphasis-700)", marginBottom: 0 }}>{body}</p>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  );
}
