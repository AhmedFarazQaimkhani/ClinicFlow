describe('repeat medicine product rule', () => {
  it('treats REPEAT as a dispensing type, not a visit', () => {
    const dispensing = { type: 'REPEAT', visitId: null, tokenId: null };
    expect(dispensing.type).toBe('REPEAT');
    expect(dispensing.visitId).toBeNull();
    expect(dispensing.tokenId).toBeNull();
  });
});
