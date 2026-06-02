# GEO + SEO Audit — slunecnice.vercel.app

> Run: 2. června 2026 · metodika geo-seo-claude · cíl: AI search (ChatGPT, Claude, Perplexity, Google AIO) + klasické SEO.
> Business type: **Other / Community + Art project** (guerilla gardening, Praha/Palmovka).

## Composite GEO Score: **62 / 100**

| Kategorie | Váha | Skóre | Poznámka |
|---|---|---|---|
| AI Citability & Visibility | 25% | **80** | sr-only answer blok, FAQ, llms.txt, krátké přímé odpovědi |
| Brand Authority Signals | 20% | **12** | nový projekt, žádné zmínky (Reddit/Wikipedia/press) |
| Content Quality & E-E-A-T | 20% | **55** | dobrý obsah + FAQ, chybí autor/credentials, tenký viditelný text na mapě |
| Technical Foundations | 15% | **90** | SSR, HSTS, sitemap, mobile, AI crawleři povoleni |
| Structured Data | 10% | **72** | WebSite+Org+Place+FAQ+Breadcrumb; chybí OG obrázek, WebApplication, geo souřadnice |
| Platform Optimization | 10% | **75** | crawler access OK, llms.txt OK |

## Co je silné (ponechat)
- **AI crawleři explicitně povoleni** v robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…). 
- **Server-rendered odpovědní blok** (první ~200 slov) + FAQ s FAQPage schématem · přesně to, co answer-engines citují.
- **llms.txt** s lokalitou a klíčovými slovy.
- **Per-místo metadata** (titulek + popis + OG obrázek z fotky) + BreadcrumbList · každé místo je samostatná indexovatelná stránka.
- Technika: HSTS, viewport, theme-color, sitemap (22 URL), čisté SSR.

## Prioritizované akce

### P1 — vysoký dopad, řeším teď (kód)
1. **Chybí OG obrázek webu.** `twitter:card=summary_large_image`, ale homepage nemá `og:image` → ošklivé náhledy při sdílení i v AI odpovědích. → přidat generovaný OG obrázek (next/og).
2. **WebApplication + geo entita.** Přidat `WebApplication` schema (je to appka) a `Place` s GPS souřadnicemi Palmovky → silnější entity recognition + lokální relevance.
3. **Autor / E-E-A-T.** Doplnit do Organization `founder` a `sameAs` (GitHub) → důvěryhodnost pro AI.
4. **Konzistentní titulek homepage** s klíčovými slovy (teď „najdi nejbližší" vs og:title „guerilla… Praha").

### P2 — mimo kód (musíš ty)
5. **Brand authority = největší slabina (12/100).** AI modely citují podle zmínek, ne backlinků. Doporučení: založit zmínky na **Reddit** (r/Prague, r/czech, guerilla gardening), **Wikipedii/Wikidata** (entita projektu), **Instagram/mapy**, lokální média (Palmovka/Praha 8). 3× silnější korelace než odkazy.
6. **Pravidelná čerstvost.** AI má recency bias (citace padají po ~3 měsících) · aktualizovat obsah / přidávat místa.

### P3 — nice to have
7. Article/CreativeWork schema (projekt jako umělecká intervence).
8. Více viditelného textu na hlavní stránce (teď skoro celá mapa).

## Závěr
Technicky a strukturálně je web nadprůměrný (90/72). Skóre táhne dolů **brand authority** (nevyhnutelné u nového projektu, řeší se off-site zmínkami) a chybějící **OG obrázek**. Po P1 fixech očekávané skóre ~**70/100**.
