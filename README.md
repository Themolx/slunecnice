# 🌻 Slunečnice

Kolektivní sázení slunečnic ve městě. Skautovací + sázecí appka pro posádku a
veřejná živá mapa zasazených slunečnic, zdrojů vody a péče.

Plný plán a canon: [SLUNECNICE_PLAN.md](SLUNECNICE_PLAN.md).

## Stack

Next.js 16 · TypeScript · Tailwind v4 · Supabase (Postgres + Storage) ·
maplibre-gl. Deploy na Vercelu.

## Rozjetí

1. **Závislosti**
   ```bash
   npm install
   ```

2. **Supabase projekt**
   - Vytvoř projekt na supabase.com.
   - V SQL editoru spusť [`supabase/schema.sql`](supabase/schema.sql)
     (vytvoří tabulky `spots`, `sunflowers`, `waterings`, bucket
     `slunecnice-photos` a otevřené RLS politiky pro Fázi 1).

3. **Env**
   ```bash
   cp .env.local.example .env.local
   ```
   Vyplň `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` a zvol si
   tajný `NEXT_PUBLIC_SCOUT_TOKEN`.

4. **Dev**
   ```bash
   npm run dev   # http://localhost:3000
   ```

## Routes

### Veřejné
- `/` — živá mapa + statistiky
- `/misto/[id]` — detail místa: foto, počet, pojmenované slunečnice, zálivky,
  akce „Zalít“ → „Pojmenovat“
- `/o-projektu` — manifest

### Posádka (jen s tokenem)
- `/scout/<TOKEN>` — dashboard: mapa + seznam + akce
- `/scout/<TOKEN>/novy` — nové místo (sázení / voda) s GPS a foto
- `/scout/<TOKEN>/[id]` — editace místa, status, počty, sázení
- `/scout/<TOKEN>/sazeni` — rychlý režim sázení (vytvoří sloty slunečnic)
- `/scout/<TOKEN>/voda` — nový zdroj vody
- `/scout/<TOKEN>/stats` — statistiky

`<TOKEN>` = hodnota `NEXT_PUBLIC_SCOUT_TOKEN`.

## Klíčový mechanismus

Sázíme jen my (posádka) a u každého místa nastavíme počet slunečnic → vzniknou
nepojmenované sloty. Veřejnost na `/misto/[id]` **zalije** místo a tím si
vyslouží právo **pojmenovat** jednu slunečnici. Péče odemyká jméno.

Barva slunečnice na mapě = suchost (zelená čerstvá → červená suchá), počítaná
z poslední zálivky.

## Fáze 2 (zatím nepostavené)

Plakát s QR (`/plakat`), admin moderace (skrývání přes `hidden` flag),
realtime push na veřejné mapě, tightening RLS.
