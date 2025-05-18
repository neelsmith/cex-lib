(function(window) {
    'use strict';

    class CEXParser {
        constructor() {
            this.blocks = {}; // Stores parsed blocks: { label: [contentString1, contentString2, ...] }
        }

        /**
         * Parses a CEX data string.
         * @param {string} cexString The CEX data as a string.
         */
        parse(cexString) {
            this.blocks = {}; // Reset blocks for new parse
            const lines = cexString.split('\n');
            let currentLabel = null;
            let currentBlockLines = [];

            for (const rawLine of lines) {
                const line = rawLine.trim();

                if (line === '' || line.startsWith('//')) {
                    continue; // Ignore empty lines and comments globally
                }

                if (line.startsWith('#!')) {
                    if (currentLabel && currentBlockLines.length > 0) {
                        if (!this.blocks[currentLabel]) {
                            this.blocks[currentLabel] = [];
                        }
                        this.blocks[currentLabel].push(currentBlockLines.join('\n'));
                    }
                    currentLabel = line.substring(2).trim();
                    currentBlockLines = [];
                } else if (currentLabel) {
                    currentBlockLines.push(rawLine); // Add raw line to preserve internal formatting
                }
            }

            if (currentLabel && currentBlockLines.length > 0) {
                if (!this.blocks[currentLabel]) {
                    this.blocks[currentLabel] = [];
                }
                this.blocks[currentLabel].push(currentBlockLines.join('\n'));
            }
            return this;
        }

        /**
         * Loads CEX data from a URL.
         * @param {string} url The URL to fetch CEX data from.
         * @returns {Promise<CEXParser>} A promise that resolves with the parser instance.
         */
        async loadFromUrl(url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
            }
            const text = await response.text();
            this.parse(text);
            return this;
        }

        /**
         * Loads CEX data from a local File object.
         * @param {File} file The File object.
         * @returns {Promise<CEXParser>} A promise that resolves with the parser instance.
         */
        loadFromFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        this.parse(event.target.result);
                        resolve(this);
                    } catch (e) {
                        reject(e);
                    }
                };
                reader.onerror = (error) => {
                    reject(error);
                };
                reader.readAsText(file);
            });
        }

        /**
         * Gets all content for a specific block label.
         * Each element in the returned array corresponds to one occurrence of the block.
         * @param {string} label The block label to search for.
         * @returns {string[]} An array of strings, where each string is the content of a block.
         */
        getBlockContents(label) {
            return this.blocks[label] || [];
        }

        /**
         * Gets a list of unique block labels found in the CEX data.
         * @returns {string[]} An array of unique block labels.
         */
        getUniqueBlockLabels() {
            return Object.keys(this.blocks);
        }

        /**
         * Finds unique values from a specified column in 'datamodels' blocks
         * where another specified column matches a given value.
         * Assumes pipe-delimited data with a header row.
         *
         * @param {string} targetModelValue The value to search for in the 'Model' column.
         * @param {string} [modelColumnName="Model"] The name of the column containing model identifiers.
         * @param {string} [collectionColumnName="Collection"] The name of the column from which to extract values.
         * @returns {string[]} An array of unique string values from the 'Collection' column, sorted.
         */
        getCollectionsForModel(targetModelValue, modelColumnName = "Model", collectionColumnName = "Collection") {
            const datamodelBlocksContent = this.getBlockContents('datamodels');
            if (!datamodelBlocksContent || datamodelBlocksContent.length === 0) {
                return [];
            }

            const allMatchingCollections = new Set();

            datamodelBlocksContent.forEach(blockContentStr => {
                // blockContentStr is a multi-line string from a single 'datamodels' block.
                // Lines that were globally empty or comments (after trim) were already filtered by parse().
                const linesInBlock = blockContentStr.split('\n');

                if (linesInBlock.length < 1) { // Need at least a header line.
                    return; // Skip this malformed block content
                }

                // The first line in the block's content string is assumed to be the header.
                // Note: Comments specific to datamodels format (e.g. // within the block but not at start of trimmed line)
                // would have been filtered by main parse if they started lines.
                // If not, they are treated as data here. Robust CEX should place such comments on their own lines.
                const headerRaw = linesInBlock[0];
                const headerParts = headerRaw.split('|').map(h => h.trim());
                const modelColIdx = headerParts.indexOf(modelColumnName);
                const collectionColIdx = headerParts.indexOf(collectionColumnName);

                if (modelColIdx === -1 || collectionColIdx === -1) {
                    console.warn(`'${modelColumnName}' or '${collectionColumnName}' column not found in datamodels block header: '${headerRaw.substring(0,100)}...'`);
                    return; // Skip this block if headers aren't as expected
                }

                // Process data lines (starting from index 1)
                for (let i = 1; i < linesInBlock.length; i++) {
                    const dataLineRaw = linesInBlock[i];
                    // Skip if the raw line is effectively empty (e.g. only whitespace, though parse() should catch most)
                    if (dataLineRaw.trim() === '') continue; 

                    const dataParts = dataLineRaw.split('|').map(d => d.trim());
                    if (dataParts.length > Math.max(modelColIdx, collectionColIdx)) { // Ensure line has enough columns
                        if (dataParts[modelColIdx] === targetModelValue) {
                            allMatchingCollections.add(dataParts[collectionColIdx]);
                        }
                    } else {
                        // console.warn(`Data line in datamodels block does not have enough columns or is malformed: '${dataLineRaw.substring(0,100)}...'`);
                    }
                }
            });

            return Array.from(allMatchingCollections).sort();
        }
    }

    if (typeof window !== 'undefined') {
        window.CEXParser = CEXParser;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CEXParser;
    }
})(typeof window !== 'undefined' ? window : this);