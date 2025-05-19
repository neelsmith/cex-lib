# A vibe-coded javascript library for working with CEX data

> *`cex.js` is a lightweight JavaScript library for parsing and working with CiteEXchange (CEX) data sources. CEX files are line-oriented, plain-text files (typically with a .cex extension) where content is organized into blocks. This library provides functionalities to load CEX data from URLs, local files, or strings, and to extract specific information from these blocks.*


## Motivation

The Homer Multitext project publishes its data releases in a single, plain-text document on github. The current release is always available at [this URL](https://raw.githubusercontent.com/homermultitext/hmt-archive/refs/heads/master/releases-cex/hmt-current.cex). The release file follows the Cite EXchange format (CEX), defined  [here](https://cite-architecture.github.io/citedx/CEX-spec-3.0.1/).

The file `cex.js` in this repository simplifies working with this data in a web browser or other javascript environment. The library is fully documented in [this markdown file](./apis.md).


## Contents of this repository

In addition to the library itself (`cex.js`) and the documentation (`apis.md`), this repository includes the following self-contained web apps you can use to explore the Homer Multitext releases or other data in CEX format:


- `cex-data-browser.html`: loads a CEX data source (by default, the Homer Multitext release), lets users choose a block type, and view its contents.
- `cex-data-models-browser.html`: loads a CEX data source from a local file, identifies all defined data models, and finds collection URNs for user-selected data model.
- `cex-data-retrieval.html`: loads a CEX data source from a local file, lets users choose from a list of block types that include delimited-text tables, and retrieves all contents of matching blocks as a single delimited-text table.

> **Note**: to run these apps, your browser must allow cross-origin requests. 




## Caveats and technical information

I built this library, but I don't (and won't) write javascript, so I gave in completely to what Anrej Karpathy has called *[vibe coding](https://x.com/karpathy/status/1886192184808149383?lang=en)*. The javascript, the markdown documentation (including the quoted summary at the top of this page), and the single-page apps were all written by gemini-2.5-pro.  I've made sure that the library passes a handful of sanity tests, but I have not looked at the code at all. When I ran into errors, I let gemini fix them. Use the code as you like, but be aware that I have no idea what it does or how it works.


## License

This repository is licensed under the [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) license. You can use the code in this repository for any purpose, but you must include a copy of the GPL-3.0 license in any distribution of the code or derivative works. See the [LICENSE](./LICENSE) file for more details.



