// Thin wrapper around the Anthropic SDK. Every call forces a tool call, so the
// model must return JSON that matches a schema. That removes the "strip the
// markdown fences and hope it parses" step the old pipeline depended on.

function createAi({ client, model }) {
    const usage = { calls: 0, inputTokens: 0, outputTokens: 0 };

    async function callTool({ system, user, tool, maxTokens = 1500 }) {
        const message = await client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: 0,
            system,
            messages: [{ role: 'user', content: user }],
            tools: [tool],
            tool_choice: { type: 'tool', name: tool.name },
        });

        usage.calls += 1;
        usage.inputTokens += message.usage?.input_tokens || 0;
        usage.outputTokens += message.usage?.output_tokens || 0;

        if (message.stop_reason === 'max_tokens') {
            throw new Error(`${tool.name}: response hit max_tokens (${maxTokens})`);
        }
        const block = (message.content || []).find(part => part.type === 'tool_use');
        if (!block || typeof block.input !== 'object' || block.input === null) {
            throw new Error(`${tool.name}: model did not return a tool call`);
        }
        return block.input;
    }

    return { callTool, model, usage };
}

module.exports = { createAi };
