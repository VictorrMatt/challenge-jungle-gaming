# Assets e placeholders

As imagens de arte (NFTs, banners e blog) ainda são **placeholders** gerados localmente. Para
substituí-las pelas exportações reais do Figma basta manter o **mesmo nome de arquivo**:

1. Exporte a imagem do Figma em PNG (2x recomendado).
2. Salve em `assets/images/<pasta>/<nome>.png`, sobrescrevendo o placeholder.
3. Rode `pnpm images` (também roda automaticamente antes de `pnpm build`).

O script `scripts/build-images.mjs` gera versões AVIF e WebP em 240, 480 e 960 px dentro de
`public/images/`, consumidas pelo componente `ResponsiveImage` com `srcset`/`sizes`.

| Arquivo fonte                         | Uso no layout                           | Proporção |
| ------------------------------------- | --------------------------------------- | --------- |
| `nfts/emerald-ape.png`                | Emerald Ape, destaque do hero e detalhe | 1:1       |
| `nfts/sage-gorilla.png`               | Sage Nomad, Violet Nomad, Cosmic Bloom  | 1:1       |
| `nfts/ivory-baron.png`                | Ivory Baron, Neon Vessel                | 1:1       |
| `nfts/golden-orangutan.png`           | Golden Beat, Golden Signal              | 1:1       |
| `banners/hero.png`                    | Arte do hero da página inicial          | 1:1       |
| `banners/promo-genesis.png`           | Card "Lançamentos gênesis"              | 287:250   |
| `banners/promo-curated.png`           | Card "Arte digital selecionada"         | 287:250   |
| `blog/blog-1.png` … `blog/blog-4.png` | Cards do "Diário da Cunhagem"           | 268:180   |

O wordmark **KURIO** é texto no Figma e foi implementado como texto (Roboto Mono Bold), sem asset.
Ícones de interface usam `lucide-react`; marcas de login social e a ilustração "Thank you" são SVGs
inline em `src/components/icons`.
