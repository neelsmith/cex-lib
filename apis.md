# CEX Parser API Documentation

## Overview

`cex-parser.js` is a lightweight JavaScript library for parsing and working with CiteEXchange (CEX) data sources. CEX files are line-oriented, plain-text files (typically with a `.cex` extension) where content is organized into blocks. This library provides functionalities to load CEX data from URLs, local files, or strings, and to extract specific information from these blocks.

## Installation / Usage

### 1. Browser Environment (HTML)

You can include the `cex-parser.js` file directly in your HTML:

```html
<script src="path/to/cex-parser.js"></script>
<script>
    // Your code using CEXParser
    const parser = new CEXParser();
    // ...
</script>
```

Or, once hosted on a service like GitHub and jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@TAG/cex-parser.js"></script>
```

The CEXParser class will be available in the global scope.
2. Node.js Environment (Optional)
While primarily designed for browsers, it can also be used in Node.js:

```javascript
const CEXParser = require('./path/to/cex-parser.js');
const parser = new CEXParser();
// ...
```


CEXParser Class
This is the main class for interacting with CEX data.
new CEXParser()
Creates a new instance of the CEX parser.
Example:

const parser = new CEXParser();


parse(cexString)
Parses CEX data directly from a string. This method populates the internal blocks property of the parser instance.
 Parameters:
 cexString (String): The CEX data as a multi-line string.
 Returns:
 CEXParser: The parser instance itself (for chaining).
 Example:

 const cexData = `#!ctsdata
// A comment line
urn:cts:greekLit:tlg0012.tlg001.msA:1.1#Μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος
#!footer
Source: HMT project
`;
const parser = new CEXParser();
parser.parse(cexData);
console.log(parser.getUniqueBlockLabels()); // Output: ['ctsdata', 'footer']



async loadFromUrl(url)
Asynchronously loads CEX data from a specified URL, then parses it.
 Parameters:
 url (String): The URL from which to fetch the CEX data.
 Returns:
 Promise<CEXParser>: A Promise that resolves with the parser instance itself (for chaining) once data is loaded and parsed, or rejects with an Error if fetching fails.
 Example:

 const parser = new CEXParser();
parser.loadFromUrl('https://example.com/data.cex')
    .then(p => {
        console.log('CEX data loaded from URL!');
        console.log(p.getUniqueBlockLabels());
    })
    .catch(error => console.error('Failed to load from URL:', error));

    loadFromFile(file)
Asynchronously loads CEX data from a local File object (typically obtained from an <input type="file"> element), then parses it.


 Parameters:
 file (File): The File object representing the local CEX file.
 Returns:
 Promise<CEXParser>: A Promise that resolves with the parser instance itself (for chaining) once the file is read and parsed, or rejects with an Error if reading fails.
 Example (in a browser context):

 <input type="file" id="fileInput">
<script>
    const parser = new CEXParser();
    const fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            parser.loadFromFile(file)
                .then(p => {
                    console.log(`CEX data loaded from ${file.name}!`);
                    console.log(p.getUniqueBlockLabels());
                })
                .catch(error => console.error('Failed to load from file:', error));
        }
    });
</script>


getBlockContents(label)
Retrieves all content sections for a specific block label. Since a CEX file can have multiple blocks with the same label, this method returns an array of strings, where each string is the complete content of one occurrence of that block (excluding the #!label line itself and any comments/empty lines).
 Parameters:
 label (String): The block label to search for (e.g., ctsdata, citelibrary).
 Returns:
 String[]: An array of strings. Each string is the content of one block matching the label. Returns an empty array if the label is not found.
 Example:

 // Assuming parser has been loaded with CEX data
const ctsDataBlocks = parser.getBlockContents('ctsdata');
ctsDataBlocks.forEach((blockContent, index) => {
    console.log(`Content of ctsdata block ${index + 1}:\n${blockContent}`);
});



getUniqueBlockLabels()
Retrieves a list of all unique block labels found in the parsed CEX data.
 Parameters: None.
 Returns:
 String[]: An array of unique block label strings, sorted alphabetically by default JavaScript object key ordering (which is usually insertion order for non-integer keys, but can vary).
 Example:

 // Assuming parser has been loaded with CEX data
const labels = parser.getUniqueBlockLabels();
console.log('Unique block labels found:', labels); // e.g., ['ctsdata', 'citelibrary', 'footer']


getDelimitedData(blockLabel, options = {})
Extracts and concatenates data from specified delimited-text block types (e.g., citedata, citecollections, citeproperties, ctscatalog, ctsdata, datamodels). Assumes pipe (|) delimited data with a header row in each block. Lines within a block that are empty or start with // (after trimming) are ignored.
 Parameters:
 blockLabel (String): The label of the blocks to process.
 options (Object, optional):
 includeHeader (Boolean, optional, default: true): If true, the header line from the first encountered block of the specified blockLabel is included at the beginning of the returned string. Subsequent headers from other blocks of the same label are ignored. If false, no header lines are included.
 Returns:
 String: A single string containing the concatenated data lines (and optionally the header from the first block), with each original line separated by \n. Returns an empty string if no relevant blocks are found or if all found blocks are empty/comments.
 Example:

 // Assuming parser has loaded CEX data with 'ctsdata' blocks
const allCtsDataWithHeader = parser.getDelimitedData('ctsdata');
console.log(allCtsDataWithHeader);

const allCtsDataNoHeader = parser.getDelimitedData('ctsdata', { includeHeader: false });
console.log(allCtsDataNoHeader);


getRelationSetData(options = {})
Extracts structured data specifically from citerelationset blocks. Each such block is expected to have a specific structure:
 A line starting with urn| followed by the URN.
 A line starting with label| followed by the label.
 A header line for the pipe-delimited data.
 Subsequent pipe-delimited data lines.
 Lines within a block's URN/label/data section that are empty or start with // (after trimming) are ignored. Malformed blocks (e.g., missing URN/label lines, or fewer than 3 processed lines) are skipped with a console warning.
 Parameters:
 options (Object, optional):
 includeHeader (Boolean, optional, default: true): If true, the data header line (the third processed line within each valid citerelationset block) is included at the start of the data string for that set. If false, only data lines are included.
 Returns:
 Object[]: An array of objects. Each object represents one parsed citerelationset block and has the following properties:
 urn (String): The URN of the relation set.
 label (String): The label of the relation set.
 data (String): A string containing the pipe-delimited data for this set (optionally including its header), with lines separated by \n.
 Returns an empty array if no valid citerelationset blocks are found.
 Example:

 // Assuming parser has loaded CEX data
const relationSets = parser.getRelationSetData({ includeHeader: true });
relationSets.forEach(set => {
    console.log(`Relation Set URN: ${set.urn}`);
    console.log(`Label: ${set.label}`);
    console.log(`Data:\n${set.data}`);
    console.log('---');
});


getUniqueModelsFromDataModels(modelColumnName = "Model")
Scans all datamodels blocks to find unique values from a specified column, typically the "Model" URN column. Assumes pipe-delimited data with a header row.
 Parameters:
 modelColumnName (String, optional, default: "Model"): The name of the column in the datamodels blocks from which to extract unique model URNs.
 Returns:
 String[]: An array of unique, sorted string values found in the specified column across all datamodels blocks.
 Example:

 // Assuming parser has loaded CEX data
const uniqueModels = parser.getUniqueModelsFromDataModels();
console.log('Unique Model URNs:', uniqueModels);


getCollectionsForModel(targetModelValue, modelColumnName = "Model", collectionColumnName = "Collection")
Finds unique "Collection" URNs from datamodels blocks where a specific "Model" URN matches. Assumes pipe-delimited data with a header row.
 Parameters:
 targetModelValue (String): The specific Model URN value to search for.
 modelColumnName (String, optional, default: "Model"): The name of the column containing model URNs.
 collectionColumnName (String, optional, default: "Collection"): The name of the column from which to extract collection URNs.
 Returns:
 String[]: An array of unique, sorted "Collection" URN strings associated with the targetModelValue.
 Example:

 // Assuming parser has loaded CEX data
const targetModel = 'urn:cite2:hmt:datamodels.v1:codexmodel';
const collections = parser.getCollectionsForModel(targetModel);
console.log(`Collections for model ${targetModel}:`, collections);

Error Handling
 Asynchronous methods (loadFromUrl, loadFromFile) return Promises that will reject with an Error object if an operation fails (e.g., network error, file read error).
 The parser will log warnings to the console via console.warn if it encounters malformed structures within specific block types (e.g., citerelationset blocks missing expected lines, or datamodels blocks missing specified header columns). These warnings do not typically stop parsing of other valid data.
 CEX Format Assumptions
The library makes the following assumptions about the CEX format:
 Blocks are separated by lines starting with #! followed by the block label.
 Empty lines (lines that are empty or contain only whitespace after trimming) are ignored globally during parsing.
 Lines starting with // (after trimming) are considered comments and are ignored globally during parsing.
 For getDelimitedData and getRelationSetData, lines within the block content that are empty or start with // (after trimming) are also filtered out before processing the data.
 Delimited data blocks (citedata, citecollections, citeproperties, ctscatalog, ctsdata, datamodels, and the data part of citerelationset) use the pipe character | as a delimiter and are expected to have a header line as their first non-comment/non-empty line (or after metadata lines for citerelationset).
 