# Vector Engagement Labs documentation site

Repository: `SrivatsaRv/vector-docs`. The site is served under the path `/docs`.

This repository contains the Docusaurus site for Vector Engagement Labs. The site has two types of pages.

- `docs/architecture/`: architecture diagram pages. This repository owns these pages.
- `docs/contracts/`: generated pages. The script `scripts/sync-vector-docs.mjs` copies `vector-lab/docs/*.md` before each `start` and `build`. Edit the contracts in the vector-lab repository only.

## Commands

```bash
npm install
npm start            # development server on http://127.0.0.1:3002/docs/
npm run build        # a broken link stops the build
npm run serve        # serves the production build on http://127.0.0.1:3002/docs/
```

The sync script uses the vector-lab checkout at `../vector-lab`. To use a different checkout, set `VECTOR_LAB_DIR`.

## Diagrams

Each diagram is an `<ArchDiagram>` element in an MDX page. The element contains data only: nodes on a grid, groups and edges. The component in `src/components/ArchDiagram` calculates the layout and draws the SVG. A change to a diagram is a change to the code, and it gets a review.

Use the same tone for the same type of component on all pages:

| Tone | Use |
| --- | --- |
| `decision` (lavender) | Browser UI and user actions |
| `core` (green) | Simulation engine and Workers |
| `output` (peach) | Records, schemas and storage |
| `edge` (blue) | Server, Cloudflare and API |
| `gate` (amber) | Validation gates that fail closed |
| `neutral` (grey) | External sources and optional items |
| `card` (white) | Items in a tinted group |

Use `blocked: true` on an edge for a dependency that a contract forbids.

## Writing rules

Write all text in ASD-STE100 Simplified Technical English. Use short sentences in the active voice, with one idea in each sentence. Do not use conversational text. Each heading must state the content of its section. Each diagram page ends with links to the contracts that it shows. When a contract changes, update its diagram in the same change.

## Deployment to Cloudflare Pages

The workflow `.github/workflows/deploy-pages.yml` builds the site and deploys it to the Cloudflare Pages project `vector-docs`. The script `scripts/assemble-pages.mjs` puts the build in `dist/docs` and redirects `/` to `/docs/`. The workflow runs on a push to `main`, on manual dispatch and one time each day. The daily run copies the latest contracts from vector-lab.

The site must not be public. The workflow does not deploy until the repository variable `PAGES_ACCESS_CONFIRMED` is `true`. Set this variable only after step 3 is complete.

Do these steps one time:

1. In Cloudflare, create the Pages project `vector-docs` as a Direct Upload project with production branch `main`.
2. Create an API token with the permission **Account > Cloudflare Pages > Edit**.
3. In Cloudflare Zero Trust, go to **Access > Applications**. Add a self-hosted application for `vector-docs.pages.dev` and `*.vector-docs.pages.dev`. Add a policy that allows only approved users, for example the `one2n.in` email domain. In the Pages project, go to **Settings > General** and enable the access policy for preview deployments.
4. In GitHub, go to **Settings > Secrets and variables > Actions** for this repository:
   - Add the secret `CLOUDFLARE_API_TOKEN` with the token from step 2.
   - Add the secret `CLOUDFLARE_ACCOUNT_ID` with your Cloudflare account ID.
   - Add the variable `PAGES_ACCESS_CONFIRMED` with the value `true`.
5. Run the workflow from the **Actions** tab, or push to `main`.

The workflow uses a GitHub-hosted runner. This repository is public, so these runs use no Actions minutes. To use a self-hosted runner, register the runner to this repository and set the repository variable `DOCS_RUNNER` to its label. A runner on a personal account serves one repository only.

Before you share the URL, open it in a private browser window. Make sure that Cloudflare Access asks for a login.
