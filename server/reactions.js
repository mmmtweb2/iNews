const fs = require('fs');
const path = require('path');

const REACTIONS_FILE = path.join(__dirname, 'reactions.json');
const VALID_EMOJIS = ['👍', '😡', '😮', '🔥'];

let reactions = {};
try {
    if (fs.existsSync(REACTIONS_FILE)) {
        reactions = JSON.parse(fs.readFileSync(REACTIONS_FILE, 'utf8'));
    }
} catch (error) {
    console.error('⚠️ לא הצלחתי לטעון reactions.json, מתחיל מריק:', error.message);
    reactions = {};
}

function save() {
    fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2));
}

function getAll() {
    return reactions;
}

function add(itemId, emoji) {
    if (!itemId || !VALID_EMOJIS.includes(emoji)) return null;
    if (!reactions[itemId]) reactions[itemId] = {};
    reactions[itemId][emoji] = (reactions[itemId][emoji] || 0) + 1;
    save();
    return reactions[itemId];
}

module.exports = { getAll, add, VALID_EMOJIS };
