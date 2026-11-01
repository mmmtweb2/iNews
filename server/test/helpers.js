const fs = require('fs');
const os = require('os');
const path = require('path');
const { Store } = require('../src/store');

function tempStore() {
    return new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'inews-test-')));
}

const silent = { log() {}, warn() {}, error() {} };

// A stand-in for the Anthropic wrapper: handlers are keyed by tool name.
function fakeAi(handlers) {
    const ai = {
        model: 'fake-model',
        usage: { calls: 0, inputTokens: 0, outputTokens: 0 },
        calls: [],
        async callTool({ tool, user, system }) {
            ai.calls.push({ tool: tool.name, user, system });
            const handler = ai.handlers[tool.name];
            if (!handler) throw new Error(`no fake handler for ${tool.name}`);
            ai.usage.calls += 1;
            ai.usage.inputTokens += 10;
            ai.usage.outputTokens += 5;
            return handler({ user, system });
        },
        handlers,
        count(name) {
            return ai.calls.filter(call => call.tool === name).length;
        },
    };
    return ai;
}

function fakeParser(feeds) {
    return {
        async parseURL(url) {
            const feed = feeds[url];
            if (!feed) throw new Error(`feed down: ${url}`);
            return typeof feed === 'function' ? feed() : feed;
        },
    };
}

function item(overrides) {
    return { title: 'כותרת', link: 'https://example.com/a', isoDate: new Date().toISOString(), contentSnippet: 'תקציר', ...overrides };
}

module.exports = { tempStore, silent, fakeAi, fakeParser, item };
