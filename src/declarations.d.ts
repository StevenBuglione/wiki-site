declare module "@theme/Layout" {
  import type { ComponentType, ReactNode } from "react";

  const Layout: ComponentType<{ title?: string; children?: ReactNode }>;
  export default Layout;
}

declare module "@docusaurus/Link" {
  import type { ComponentType, ReactNode } from "react";

  const Link: ComponentType<{ to?: string; href?: string; children?: ReactNode }>;
  export default Link;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
