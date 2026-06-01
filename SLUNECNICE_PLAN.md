# SLUNEČNICE · projektový plán a canon

> Stav: 1. června 2026. Kolektivní sázení slunečnic ve městě. Tento dokument je kompletní přehled projektu.

---

## Co je Slunečnice

Galerie Označník, ale pro živé rostliny místo tisků. Kolektivní guerillové sázení slunečnic ve městě. Stejný třífázový životní cyklus jako galerie:

| Galerie Označník | Slunečnice |
|---|---|
| Skautování prázdných rámečků | Skautování míst vhodných k sázení |
| Vernisáž = instalace tisků | Vernisáž = sázení slunečnic |
| Veřejnost vidí mapu výstavy | Veřejnost vidí živou mapu slunečnic |

### Tři plochy

1. **Skaut/posádka** · privátní, token-gated, mobil. Posádka chodí městem a zakládá místa (GPS + foto + poznámky), pak na nich sází.
2. **Sázení** · privátní, token-gated. Sázíme jen my (posádka). Zaznamenáme "tady jsme zasadili X slunečnic."
3. **Veřejná živá mapa** · otevřená všem. QR na plakátu míří sem. Ukazuje zasazená místa, počty, zdroje vody. Veřejnost může zalévat a pojmenovávat slunečnice.

### Klíčový mechanismus: zálivka odemyká pojmenování

Sázíme jen my a u každého místa nastavíme počet slunečnic. Každá slunečnice je samostatný slot. Člověk z veřejnosti, který místo **zalije**, si tím vyslouží právo **pojmenovat** jednu nepojmenovanou slunečnici. Péče odemyká jméno. Každé jméno na mapě je tak důkaz, že někdo přišel a postaral se.

---

## Tech stack (zděděno z tram-gallery, ověřeno na Vercelu)

- Next.js 16 + TypeScript + Tailwind v4
- Supabase: Postgres + Storage (fotky) + Realtime (živá mapa)
- maplibre-gl (mapy bez API klíče, free dlaždice OpenFreeMap)
- qrcode + @react-pdf/renderer pro plakát / QR
- Deploy: Vercel. Data: Supabase.

---

## Datový model (Supabase)

### `spots` · každý bod na mapě
```
id              uuid pk
kind            'planting' | 'water'
name            text          -- "U lavičky v parku Folimanka"
lat, lon        double
status          text          -- navrženo | vhodné | zasazeno | kvete | zaniklo
water_type      text          -- jen pro kind=water: tap | fountain | stream
sunflower_count int           -- kolik slunečnic zasazeno (planting)
notes           text
photo_paths     text[]
created_by      text          -- jméno skauta / štítek
created_at, updated_at  timestamptz
```

### `sunflowers` · jedna řádka na slunečnici, vytvořeno při zápisu sázení
```
id           uuid pk
spot_id      uuid fk -> spots
index        int            -- 1..N v rámci místa
name         text           -- null dokud není pojmenováno
message      text
named_by     text
web_consent  bool           -- ukázat jméno autora veřejně
photo_path   text
named_at     timestamptz
hidden       bool           -- moderace
```

### `waterings` · log péče
```
id            uuid pk
spot_id       uuid fk -> spots
sunflower_id  uuid fk -> sunflowers  (null ok)
watered_by    text
note          text
photo_path    text
watered_at    timestamptz
hidden        bool           -- moderace
```

**Storage bucket** `slunecnice-photos` (public, on-the-fly thumbnail transforms pro nízký egress).

Detail místa ukazuje "8 z 12 pojmenováno" a "naposledy zaléváno před 3 dny", s barvou suchosti, která se otepluje čím déle místo nikdo nezalil.

---

## Routes

### Veřejné (otevřené)
- `/` · živá mapa + hero + statistiky ("142 slunečnic na 23 místech"). Realtime.
- `/misto/[id]` · detail místa: fotky, počet, pojmenované slunečnice, historie zálivek, CTA "Zalít" a "Pojmenovat".
- `/o-projektu` · manifest / o projektu / jak se zapojit.
- `/plakat` · plakát s QR kódem, exportovatelný do PDF.

### Posádka (token-gated `/scout/[token]`, token v env proměnné)
- `/scout/[token]` · seznam + mapa všech míst, filtr podle kind/status.
- `/scout/[token]/novy` · nové místo: "Použít mou polohu" GPS, foto, název, poznámky, kind.
- `/scout/[token]/[id]` · editace místa: status, počty, poznámky, fotky.
- `/scout/[token]/sazeni` · režim sázení: vybrat místo, zapsat počet zasazených → vygeneruje sloty slunečnic, status `zasazeno`.
- `/scout/[token]/voda` · rychlé přidání zdroje vody.
- `/scout/[token]/stats` · součty, postup.

---

## Funkce, jak fungují

**Skautování + sázení.** Posádka otevře `/scout/[token]/novy`, klikne "Použít mou polohu" (geolokace prohlížeče), vyfotí, pojmenuje, přidá poznámky. Při sázení v režimu `sazeni` zadá počet skutečně zasazených slunečnic → status `zasazeno` → vygenerují se sloty slunečnic.

**Veřejná živá mapa.** `/` renderuje `planting` místa jako markery slunečnic (velikost dle počtu) + `water` jako přepínatelnou vrstvu. Realtime kanál pushuje nové zálivky/jména. ISR cache (60s) drží egress nízko.

**Zálivka odemyká jméno.** Na detailu místa veřejnost klikne "Zalít" → zápis do `waterings` → "Díky! Chceš pojmenovat slunečnici?" → pojmenuje jednu nepojmenovanou (+ volitelně zpráva/foto/souhlas se jménem). Místo ukáže "8 z 12 pojmenováno."

**Suchost.** Detail i mapa ukazují "naposledy zaléváno před X dny" a barva míst se otepluje čím déle bez vody, aby veřejnost viděla, co potřebuje zalít.

**Zdroje vody.** Samostatná vrstva markerů, aby zalévači věděli, kde nabrat vodu.

**Plakát + QR.** `/plakat` generuje plakát s QR na `/`.

**Moderace.** Plně otevřené zápisy, admin pohled pro skrytí závadných jmen/fotek (`hidden` flag).

---

## Design

Estetika galerie (těžká konstruktivistická typografie, silná struktura), ale **zaoblené rohy**. Akcent slunečnicová žlutá `#F5C518` na téměř bílé, sekundární hluboká zelená pro vodu/péči. Iterujeme vizuálně jakmile bude na obrazovce.

---

## Fáze (pořadí stavby)

- **Fáze 1 (teď):** skeleton, Supabase schema, posádka app (novy/edit/mapa/sázení/voda), veřejná mapa (read-only), detail místa. = skautovat a sázet.
- **Fáze 2:** veřejný flow zálivka→jméno, indikátor suchosti, admin moderace, plakát/QR.
