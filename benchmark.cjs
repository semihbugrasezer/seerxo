const fs = require('fs');

const generateData = () => {
    const chunks = [];
    for (let i = 0; i < 10000; i++) {
        chunks.push(`{"jsonrpc": "2.0", "method": "test", "params": {"id": ${i}}}\n`);
    }
    return chunks;
};

const data = generateData();

const benchmarkSplit = () => {
    let buffer = '';
    const start = performance.now();
    for (const chunk of data) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) continue;
            JSON.parse(line);
        }
    }
    return performance.now() - start;
};

const benchmarkIndexOf = () => {
    let buffer = '';
    const start = performance.now();
    for (const chunk of data) {
        buffer += chunk;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (!line.trim()) continue;
            JSON.parse(line);
        }
    }
    return performance.now() - start;
};

// Warmup
benchmarkSplit();
benchmarkIndexOf();

let splitTotal = 0;
let indexTotal = 0;
const iterations = 100;
for (let i = 0; i < iterations; i++) {
    splitTotal += benchmarkSplit();
    indexTotal += benchmarkIndexOf();
}

console.log(`Split avg: ${splitTotal / iterations}ms`);
console.log(`IndexOf avg: ${indexTotal / iterations}ms`);
