describe("polyfill getOrInsertComputed", () => {
    test("throws if callback not function", () => {
        const m = new Map();
        let threw = false;
        try {
            m.getOrInsertComputed("k", "not a function");
        } catch {
            threw = true;
        }
        expect(threw).toBe(true);
    });
});
