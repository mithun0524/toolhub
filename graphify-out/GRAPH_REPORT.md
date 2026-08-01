# Graph Report - /Users/mithunchavan/Desktop/toolhub  (2026-08-01)

## Corpus Check
- 13 files · ~53,928 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4063 nodes · 8652 edges · 36 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 364 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `set()` - 144 edges
2. `ConfigNamespace` - 141 edges
3. `TemplateNamespace` - 115 edges
4. `CanvasGraphics` - 95 edges
5. `create()` - 88 edges
6. `AnnotationEditorUIManager` - 80 edges
7. `AnnotationEditor` - 77 edges
8. `has()` - 75 edges
9. `XFAObject` - 54 edges
10. `get()` - 54 edges

## Surprising Connections (you probably didn't know these)
- `n()` --calls--> `toString()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/vendor/qrcode.min.js → /Users/mithunchavan/Desktop/toolhub/vendor/pdf.min.js
- `add()` --calls--> `loadImageFile()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/main.js
- `processAll()` --calls--> `process()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/vendor/pdf.worker.min.js
- `render()` --calls--> `buildPalette()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/js/main.js
- `downloadAll()` --calls--> `has()`  [INFERRED]
  /Users/mithunchavan/Desktop/toolhub/js/image-batch.js → /Users/mithunchavan/Desktop/toolhub/vendor/pdf.min.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (451): abort(), accept(), Acrobat, Acrobat7, ADBE_JSConsole, ADBE_JSDebugger, addPara(), _addPixels() (+443 more)

### Community 1 - "Community 1"
Cohesion: 0.01
Nodes (138): n(), #a(), add(), addChildren(), _addNamespacePrefix(), addNode(), addPdfFont(), addTopLevelNode() (+130 more)

### Community 2 - "Community 2"
Cohesion: 0.01
Nodes (196): buildPalette(), addFontStyle(), addNativeFontFace(), AnnotationElement, AnnotationElementFactory, appendText(), applyBoundingBox(), applyInverseTransform() (+188 more)

### Community 3 - "Community 3"
Cohesion: 0.01
Nodes (30): closePalette(), initDropZone(), initInstall(), initOffline(), initShortcuts(), openPalette(), AnnotationEditor, AnnotationEditorLayer (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.01
Nodes (95): add(), clear(), downloadAll(), loadZip(), processAll(), removeAt(), render(), buildChrome() (+87 more)

### Community 5 - "Community 5"
Cohesion: 0.02
Nodes (52): _queueLoadingCallback(), addHex(), Ascii85Stream, AsciiHexStream, BaseStream, BinaryCMapStream, checkHeader(), CMap (+44 more)

### Community 6 - "Community 6"
Cohesion: 0.02
Nodes (119): A(), c(), d(), f(), G(), h(), i(), j() (+111 more)

### Community 7 - "Community 7"
Cohesion: 0.01
Nodes (43): applyAssist(), Arc, Area, ariaLabel(), BooleanElement, Button, Caption, CheckButton (+35 more)

### Community 8 - "Community 8"
Cohesion: 0.01
Nodes (15): BaseCMapReaderFactory, BaseStandardFontDataFactory, cancelAllRequests(), createFetchOptions(), createHeaders(), DOMCMapReaderFactory, DOMStandardFontDataFactory, fetchData() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.01
Nodes (2): ConfigNamespace, fingerprints()

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (6): PDFDocumentProxy, PDFPageProxy, sendWithPromise(), sendWithStream(), time(), WorkerTransport

### Community 11 - "Community 11"
Cohesion: 0.03
Nodes (24): connect(), consumeEvents(), evaluate(), getJSON(), Session, BaseFullReader, createRequestOptions(), getArrayBuffer() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (22): BitModel, ContextCache, copyCoefficients(), decodeBitmap(), decodeIAID(), decodeInteger(), decodeMMRBitmap(), decodeRefinement() (+14 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (13): s(), o(), ARCFourCipher, calculateSHA384(), CalGrayCS, CalRGBCS, CipherTransform, CipherTransformFactory (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (9): AlternateCS, ColorSpace, decodeAndClamp(), DeviceRgbCS, ImageResizer, IndexedCS, LabCS, PDFImage (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.04
Nodes (10): BasePdfManager, ensure(), getRangeReader(), htmlForXfa(), isPureXfa(), numPages(), Page, sendRequest() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (11): CFFCompiler, CFFDict, CFFOffsetTracker, CFFPrivateDict, CFFStrings, CFFTopDict, createDict(), emptyPrivateDictionary() (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (15): KeyboardManager, toDateObject(), buildRoot(), DatasetXMLParser, isNsAgnostic(), isWhitespace(), onText(), parseFromString() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.1
Nodes (6): AnnotationStorage, CheckboxWidgetAnnotationElement, ChoiceWidgetAnnotationElement, RadioButtonWidgetAnnotationElement, TextWidgetAnnotationElement, WidgetAnnotationElement

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (11): compileGlyf(), CompositeGlyph, getFloat214(), getInt16(), getInt8(), getUint16(), Glyph, GlyphHeader (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (7): AstArgument, AstBinaryOperation, AstLiteral, AstMin, AstVariable, AstVariableDefinition, ExpressionBuilderVisitor

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (1): LocaleSetNamespace

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (6): CFFFDSelect, compileCharString(), CompiledFont, getSubroutineBias(), lookupCmap(), Type2Compiled

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (1): ConnectionSetNamespace

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (4): cancelAllRequests(), PDFWorkerStreamRangeReader, PDFWorkerStreamReader, sendWithStream()

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (4): d(), n(), r(), s()

### Community 26 - "Community 26"
Cohesion: 0.2
Nodes (2): NullOptimizer, QueueOptimizer

### Community 27 - "Community 27"
Cohesion: 0.47
Nodes (1): LinkAnnotationElement

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (1): PostScriptToken

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (1): XFAAttribute

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (1): CFFIndex

### Community 31 - "Community 31"
Cohesion: 0.4
Nodes (2): AES128Cipher, AES256Cipher

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **2 isolated node(s):** `PixelsPerInch`, `NodeFilterFactory`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 33`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `set-domain.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `theme.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `set()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 17`, `Community 18`, `Community 19`, `Community 31`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `ConfigNamespace` connect `Community 9` to `Community 0`, `Community 1`, `Community 4`, `Community 16`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `TemplateNamespace` connect `Community 8` to `Community 0`, `Community 1`, `Community 4`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `set()` (e.g. with `wordFrequency()` and `l()`) actually correct?**
  _`set()` has 28 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PixelsPerInch`, `NodeFilterFactory` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._