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
                    console.warn(`'${modelColumnName}' or '${collectionColumnName}' column not found in datamodels header: '${headerRaw.substring(0,100)}...'`);
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

        /**
         * Finds all unique values for the 'Model' column in all 'datamodels' blocks.
         * Assumes pipe-delimited data with a header row.
         *
         * @param {string} [modelColumnName="Model"] The name of the column from which to extract model URNs.
         * @returns {string[]} An array of unique string values from the 'Model' column, sorted.
         */
        getUniqueModelsFromDataModels(modelColumnName = "Model") {
            const datamodelBlocksContent = this.getBlockContents('datamodels');
            if (!datamodelBlocksContent || datamodelBlocksContent.length === 0) {
                return [];
            }

            const allUniqueModels = new Set();

            datamodelBlocksContent.forEach(blockContentStr => {
                const linesInBlock = blockContentStr.split('\n');
                if (linesInBlock.length < 1) { // Need at least a header line
                    return;
                }

                const headerRaw = linesInBlock[0];
                const headerParts = headerRaw.split('|').map(h => h.trim());
                const targetColIdx = headerParts.indexOf(modelColumnName); // Target the model column

                if (targetColIdx === -1) {
                    console.warn(`'${modelColumnName}' column not found in datamodels block header: '${headerRaw.substring(0,100)}...'`);
                    return; // Skip this block if the 'Model' column isn't found
                }

                // Process data lines (starting from index 1)
                for (let i = 1; i < linesInBlock.length; i++) {
                    const dataLineRaw = linesInBlock[i];
                    if (dataLineRaw.trim() === '') continue; // Skip empty or whitespace-only lines

                    const dataParts = dataLineRaw.split('|').map(d => d.trim());
                    if (dataParts.length > targetColIdx) { // Ensure line has enough columns for the model
                        allUniqueModels.add(dataParts[targetColIdx]); // Add the value from the model column
                    } else {
                        // console.warn(`Data line in datamodels block does not have enough columns for '${modelColumnName}': '${dataLineRaw.substring(0,100)}...'`);
                    }
                }
            });

            return Array.from(allUniqueModels).sort();
        }
    }

    if (typeof window !== 'undefined') {
        window.CEXParser = CEXParser;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CEXParser;
    }
})(typeof window !== 'undefined' ? window : this);
