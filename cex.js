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
                    continue; // Ignore empty lines and comments
                }

                if (line.startsWith('#!')) {
                    // If there was a previous block, store its collected lines
                    if (currentLabel && currentBlockLines.length > 0) {
                        if (!this.blocks[currentLabel]) {
                            this.blocks[currentLabel] = [];
                        }
                        this.blocks[currentLabel].push(currentBlockLines.join('\n'));
                    }
                    // Start a new block
                    currentLabel = line.substring(2).trim();
                    currentBlockLines = []; // Reset lines for the new block
                } else if (currentLabel) {
                    // Only add lines if we are inside a block
                    // We use rawLine here to preserve original indentation within a block,
                    // though trimming is generally good for block content lines too.
                    // For simplicity and to match common CEX usage, let's add the non-trimmed line.
                    currentBlockLines.push(rawLine);
                }
            }

            // Store the last block's lines if any
            if (currentLabel && currentBlockLines.length > 0) {
                if (!this.blocks[currentLabel]) {
                    this.blocks[currentLabel] = [];
                }
                this.blocks[currentLabel].push(currentBlockLines.join('\n'));
            }
            return this; // Allow chaining
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
    }

    // Expose CEXParser to the global scope (for browser environments)
    if (typeof window !== 'undefined') {
        window.CEXParser = CEXParser;
    }

    // For Node.js environment (optional, but good practice for a library)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CEXParser;
    }

})(typeof window !== 'undefined' ? window : this);
