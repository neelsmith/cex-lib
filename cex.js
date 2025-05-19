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
                    currentBlockLines.push(rawLine);
                }
            }
            if (currentLabel && currentBlockLines.length > 0) {
                if (!this.blocks[currentLabel]) this.blocks[currentLabel] = [];
                this.blocks[currentLabel].push(currentBlockLines.join('\n'));
            }
            return this;
        }

        async loadFromUrl(url) {
            // ... (same as before)
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
            const text = await response.text();
            this.parse(text);
            return this;
        }

        loadFromFile(file) {
            // ... (same as before)
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
            // ... (same as before)
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
                if (modelColIdx === -1 || collectionColIdx === -1) return;
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
            // ... (same as before)
            const datamodelBlocksContent = this.getBlockContents('datamodels');
            if (!datamodelBlocksContent || datamodelBlocksContent.length === 0) return [];
            const allUniqueModels = new Set();
            datamodelBlocksContent.forEach(blockContentStr => {
                const linesInBlock = blockContentStr.split('\n');
                if (linesInBlock.length < 1) return;
                const headerRaw = linesInBlock[0];
                const headerParts = headerRaw.split('|').map(h => h.trim());
                const targetColIdx = headerParts.indexOf(modelColumnName);
                if (targetColIdx === -1) return;
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

        getDelimitedData(blockLabel, options = {}) {
            // ... (same as before, no changes needed here)
            const { includeHeader = true } = options;
            const blockContentStrings = this.getBlockContents(blockLabel);
            if (!blockContentStrings || blockContentStrings.length === 0) {
                return "";
            }
            const resultLines = [];
            let headerProcessedAndAdded = false;
            blockContentStrings.forEach(blockContentStr => {
                const rawLinesInBlock = blockContentStr.split('\n');
                const processedLinesInBlock = rawLinesInBlock
                    .map(line => line.trim())
                    .filter(trimmedLine => trimmedLine !== '' && !trimmedLine.startsWith('//'));
                if (processedLinesInBlock.length === 0) return;
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

        /**
         * Extracts data from 'citerelationset' blocks.
         * Each block is expected to have:
         * 1. URN line: "urn|<value>"
         * 2. Label line: "label|<value>"
         * 3. Header line for data (pipe-delimited)
         * 4. Data lines (pipe-delimited)
         *
         * @param {object} [options={}] Options for data extraction.
         * @param {boolean} [options.includeHeader=true] Whether to include the data header line.
         * @returns {object[]} An array of objects, each representing a parsed 'citerelationset' block.
         *                   Each object has `urn`, `label`, and `data` (string) properties.
         *                   Returns an empty array if no valid blocks are found.
         */
        getRelationSetData(options = {}) {
            const { includeHeader = true } = options;
            const blockContentStrings = this.getBlockContents('citerelationset');
            if (!blockContentStrings || blockContentStrings.length === 0) {
                return [];
            }

            const relationSets = [];

            blockContentStrings.forEach(blockContentStr => {
                const rawLinesInBlock = blockContentStr.split('\n');
                // Process lines within this specific block: trim, filter empty and comments
                const processedLinesInBlock = rawLinesInBlock
                    .map(line => line.trim())
                    .filter(trimmedLine => trimmedLine !== '' && !trimmedLine.startsWith('//'));

                if (processedLinesInBlock.length < 3) { // Min: urn, label, data_header
                    console.warn("Skipping malformed citerelationset block: not enough lines for urn, label, and data header. Content:", blockContentStr.substring(0, 150) + "...");
                    return; // Skip this block
                }

                let parsedUrn = null;
                let parsedLabel = null;
                
                const urnLineContent = processedLinesInBlock[0];
                if (urnLineContent.toLowerCase().startsWith("urn|")) {
                    parsedUrn = urnLineContent.substring(4).trim();
                } else {
                    console.warn("Skipping citerelationset block: URN line malformed or missing. Expected 'urn|...'. Found:", urnLineContent);
                    return; // Skip this block
                }

                const labelLineContent = processedLinesInBlock[1];
                if (labelLineContent.toLowerCase().startsWith("label|")) {
                    parsedLabel = labelLineContent.substring(6).trim();
                } else {
                    console.warn("Skipping citerelationset block: Label line malformed or missing. Expected 'label|...'. Found:", labelLineContent);
                    return; // Skip this block
                }
                
                const dataHeaderLine = processedLinesInBlock[2];
                const dataContentLines = processedLinesInBlock.slice(3);

                let dataString = "";
                if (includeHeader) {
                    dataString = dataHeaderLine; // Always include the specific header for this relation set's data
                    if (dataContentLines.length > 0) {
                        dataString += '\n' + dataContentLines.join('\n');
                    }
                } else {
                    if (dataContentLines.length > 0) {
                        dataString = dataContentLines.join('\n');
                    }
                }

                relationSets.push({
                    urn: parsedUrn,
                    label: parsedLabel,
                    data: dataString
                });
            });

            return relationSets;
        }
    }

    if (typeof window !== 'undefined') {
        window.CEXParser = CEXParser;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CEXParser;
    }
})(typeof window !== 'undefined' ? window : this);