# branthahn.com

A small, static personal site for Brant Hahn. The homepage introduces his strategy and public work; `technical.html` covers software architecture and agentic coding. Biographical and career content is based on his LinkedIn profile and 2026 resume. Project descriptions link to the public [GitHub repositories](https://github.com/bhahn1800), and the site links to his [Hugging Face profile](https://huggingface.co/bhahn1800). The resume itself is not published in this repository.

## Preview locally

Open `index.html` in a browser, or run a local static server:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Publish with GitHub Pages

1. Push this repository to GitHub.
2. In the repository, open **Settings → Pages** and choose **Deploy from a branch**, then `main` and `/ (root)`.
3. In **Settings → Pages → Custom domain**, confirm `branthahn.com`. The root `CNAME` file records the same domain in this repository.
4. In Route 53, add the apex `A` records and a `www` `CNAME` pointing to your GitHub Pages default domain, following [GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Add the custom domain in GitHub before changing DNS.
5. Wait for DNS and the HTTPS certificate, then enable **Enforce HTTPS** in Pages.

Do not change the domain's Route 53 registration or auto-renew setting as part of publishing the site.
