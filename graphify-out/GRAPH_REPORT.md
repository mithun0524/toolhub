# Graph Report - /Users/mithunchavan/Desktop/toolhub  (2026-07-30)

## Corpus Check
- 7 files · ~13,156 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 82 nodes · 108 edges · 17 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `add()` - 6 edges
2. `render()` - 6 edges
3. `downloadAll()` - 6 edges
4. `ageBetween()` - 5 edges
5. `Session` - 4 edges
6. `showToast()` - 4 edges
7. `setBusy()` - 4 edges
8. `processAll()` - 3 edges
9. `copyToClipboard()` - 3 edges
10. `downloadBlob()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `add()` --calls--> `loadImageFile()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/main.js
- `render()` --calls--> `formatBytes()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/tools-core.js
- `render()` --calls--> `buildPalette()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/main.js
- `downloadAll()` --calls--> `downloadBlob()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/main.js
- `add()` --calls--> `showToast()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/main.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (0): 

### Community 2 - "Community 2"
Cohesion: 0.27
Nodes (12): add(), clear(), downloadAll(), loadZip(), processAll(), removeAt(), render(), copyToClipboard() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (4): connect(), evaluate(), getJSON(), Session

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (5): addMonths(), ageBetween(), daysInMonth(), parseISODate(), toUTC()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (3): buildPool(), generatePassword(), randomInt()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (2): buildPalette(), openPalette()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): downloadBlob(), downloadFile()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): buildChrome(), svg()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): formatCurrency(), formatNum()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (2): generateLorem(), makeRng()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): atobImpl(), b64Decode()

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (2): b64Encode(), btoaImpl()

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (2): amortization(), emi()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 7`** (2 nodes): `buildPalette()`, `openPalette()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `downloadBlob()`, `downloadFile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `buildChrome()`, `svg()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `formatCurrency()`, `formatNum()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `generateLorem()`, `makeRng()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `atobImpl()`, `b64Decode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `b64Encode()`, `btoaImpl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `amortization()`, `emi()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `set-domain.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `theme.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `render()` connect `Community 2` to `Community 7`?**
  _High betweenness centrality (0.352) - this node is a cross-community bridge._
- **Why does `formatBytes()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.336) - this node is a cross-community bridge._
- **Why does `buildPalette()` connect `Community 7` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `add()` (e.g. with `loadImageFile()` and `showToast()`) actually correct?**
  _`add()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `render()` (e.g. with `formatBytes()` and `buildPalette()`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `downloadAll()` (e.g. with `showToast()` and `downloadBlob()`) actually correct?**
  _`downloadAll()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._