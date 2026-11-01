const test = require('node:test');
const assert = require('node:assert/strict');
const { computeCoverage } = require('../src/pipeline/coverage');

const src = (id, lean) => ({ id, lean });

test('a political story reported only on the right is a blind spot for the left', () => {
    const coverage = computeCoverage([src('a', 'right'), src('b', 'center-right')], ['politics']);
    assert.equal(coverage.blindspot, 'left');
    assert.deepEqual(coverage.counts, { left: 0, center: 0, right: 2, unrated: 0 });
});

test('a political story reported only on the left is a blind spot for the right', () => {
    assert.equal(computeCoverage([src('a', 'left'), src('b', 'center-left')], ['security']).blindspot, 'right');
});

test('no blind spot when both sides, or the center, reported it', () => {
    assert.equal(computeCoverage([src('a', 'left'), src('b', 'right')], ['politics']).blindspot, null);
    assert.equal(computeCoverage([src('a', 'center')], ['politics']).blindspot, null);
    assert.equal(computeCoverage([src('a', 'right'), src('b', 'center')], ['politics']).blindspot, null);
});

test('non-political topics and unrated sources never produce a blind spot', () => {
    assert.equal(computeCoverage([src('a', 'right')], ['sports']).blindspot, null);
    assert.equal(computeCoverage([src('a', null), src('b', null)], ['politics']).blindspot, null);
});

test('the same outlet is counted once', () => {
    const coverage = computeCoverage([src('a', 'right'), src('a', 'right'), src('b', null)], ['politics']);
    assert.equal(coverage.sourceCount, 2);
    assert.equal(coverage.counts.right, 1);
    assert.equal(coverage.counts.unrated, 1);
});
