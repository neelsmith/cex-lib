(function(window) {
    'use strict';

    class CEXParser {
        constructor() {
            this.blocks = {};
        }

        parse(cexString) {
            this.blocks = {};
            const lines = cexString.split('\n');
            let currentLabel = null;
            let currentBlockLines = [];

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (line === '' || line.startsWith('//')) continue;

                if (line.startsWith('#!')) {
                    if (currentLabel && currentBlockLines.length > 0) {
                        if (!this.blocks[currentLabel]) this.blocks[currentLabel] = [];
                        this.blocks[currentLabel].push(currentBlockLines.join('\n'));
                    }
                    currentLabel = line.substring(2).trim();
                    currentBlockLines = [];
                } else if (currentLabel) {
                    currentBlockLines.push(rawLine); // Add raw line to preserve internal formatting
                }
            }
            if (currentLabel && currentBlockLines.length > 0) {
                if (!this.blocks[currentLabel]) this.blocks[currentLabel] = [];
                this.blocks[currentLabel].push(currentBlockLines.join('\n'));
            }
            return this;
        }

        async loadFromUrl(url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
            const text = await response.text();
            this.parse(text);
            return this;
        }

        loadFromFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        this.parse(event.target.result);
                        resolve(this);
                    } catch (e) { reject(e); }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsText(file);
            });
        }

        getBlockContents(label) {
            return this.blocks[label] || [];
        }

        getUniqueBlockLabels() {
            return Object.keys(this.blocks);
        }

        getCollectionsForModel(targetModelValue, modelColumnName = "Model", collectionColumnName = "Collection") {
            const datamodelBlocksContent = this.getBlockContents('datamodels');
            if (!datamodelBlocksContent || datamodelBlocksContent.length === 0) return [];
            const allMatchingCollections = new Set();
            datamodelBlocksContent.forEach(blockContentStr => {
                const linesInBlock = blockContentStr.split('\n');
                if (linesInBlock.length < 1) return;
                const headerRaw = linesInBlock[0];
                const headerParts = headerRaw.split('|').map(h => h.trim());
                const modelColIdx = headerParts.indexOf(modelColumnName);
                const collectionColIdx = headerParts.indexOf(collectionColumnName);
                if (modelColIdx === -1 || collectionColIdx === -1) {
                    // console.warn(`'${modelColumnName}' or '${collectionColumnName}' column not found in datamodels header: '${headerRaw.substring(0,100)}...'`);
                    return;
                }
                for (let i = 1; i < linesInBlock.length; i++) {
                    const dataLineRaw = linesInBlock[i];
                    if (dataLineRaw.trim() === '') continue;
                    const dataParts = dataLineRaw.split('|').map(d => d.trim());
                    if (dataParts.length > Math.max(modelColIdx, collectionColIdx)) {
                        if (dataParts[modelColIdx] === targetModelValue) {
                            allMatchingCollections.add(dataParts[collectionColIdx]);
                        }
                    }
                }
            });
            return Array.from(allMatchingCollections).sort();
        }

        getUniqueModelsFromDataModels(modelColumnName = "Model") {
            const datamodelBlocksContent = this.getBlockContents('datamodels');
            if (!datamodelBlocksContent || datamodelBlocksContent.length === 0) return [];
            const allUniqueModels = new Set();
            datamodelBlocksContent.forEach(blockContentStr => {
                const linesInBlock = blockContentStr.split('\n');
                if (linesInBlock.length < 1) return;
                const headerRaw = linesInBlock[0];
                const headerParts = headerRaw.split('|').map(h => h.trim());
                const targetColIdx = headerParts.indexOf(modelColumnName);
                if (targetColIdx === -1) {
                    // console.warn(`'${modelColumnName}' column not found in datamodels header: '${headerRaw.substring(0,100)}...'`);
                    return;
                }
                for (let i = 1; i < linesInBlock.length; i++) {
                    const dataLineRaw = linesInBlock[i];
                    if (dataLineRaw.trim() === '') continue;
                    const dataParts = dataLineRaw.split('|').map(d => d.trim());
                    if (dataParts.length > targetColIdx) {
                        allUniqueModels.add(dataParts[targetColIdx]);
                    }
                }
            });
            return Array.from(allUniqueModels).sort();
        }

        /**
         * Extracts and concatenates data from specified delimited-text block types.
         * Assumes pipe ('|') delimited data with a header row in each block.
         * Filters out empty lines and comment lines (starting with '//') within block content.
         *
         * @param {string} blockLabel The label of the blocks to process (e.g., 'ctsdata', 'datamodels').
         * @param {object} [options={}] Options for data extraction.
         * @param {boolean} [options.includeHeader=true] Whether to include the header line.
         *                                               If true, the header from the first processed block is used.
         * @returns {string} A single string containing the concatenated data, with lines separated by '\n'.
         */
        getDelimitedData(blockLabel, options = {}) {
            const { includeHeader = true } = options;
            const blockContentStrings = this.getBlockContents(blockLabel);
            if (!blockContentStrings || blockContentStrings.length === 0) {
                return "";
            }

            const resultLines = [];
            let headerProcessedAndAdded = false;

            blockContentStrings.forEach(blockContentStr => {
                const rawLinesInBlock = blockContentStr.split('\n');

                // Process lines within this specific block: trim, filter empty and comments
                const processedLinesInBlock = rawLinesInBlock
                    .map(line => line.trim())
                    .filter(trimmedLine => trimmedLine !== '' && !trimmedLine.startsWith('//'));

                if (processedLinesInBlock.length === 0) {
                    return; // Skip this block if it's empty after internal filtering
                }

                const headerLine = processedLinesInBlock[0];
                const dataLines = processedLinesInBlock.slice(1);

                if (includeHeader) {
                    if (!headerProcessedAndAdded) {
                        resultLines.push(headerLine);
                        headerProcessedAndAdded = true;
                    }
                }
                resultLines.push(...dataLines);
            });

            return resultLines.join('\n');
        }
    }

    if (typeof window !== 'undefined') {
        window.CEXParser = CEXParser;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CEXParser;
    }
})(typeof window !== 'undefined' ? window : this);