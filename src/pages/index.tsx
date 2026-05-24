import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";

export default function HomePage() {
  return (
    <Layout title="AI Wiki">
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <h1>AI Wiki</h1>
        <p>Repo-backed wiki for humans and AI agents.</p>
        <p>
          <Link to="/wiki/?s=devops&p=index">Open the wiki</Link>
        </p>
      </main>
    </Layout>
  );
}
