const { Pattern } = require("../src/pattern.js");

const toObjectLike = (object) => JSON.parse(JSON.stringify(object));

describe("Pattern", () => {
    // ----------------------------------------------------------
    // STATIC SEGMENT
    // ----------------------------------------------------------

    describe("static segment", () => {
        test("match exact", () => {
            expect(new Pattern("blogs").test("blogs")).toBe(true);
        });

        test("nggak match partial", () => {
            expect(new Pattern("blogs").test("blog")).toBe(false);
            expect(new Pattern("blogs").test("blogs2")).toBe(false);
        });

        test("case sensitive", () => {
            expect(new Pattern("blogs").test("Blogs")).toBe(false);
        });

        test("nggak match string kosong", () => {
            expect(new Pattern("blogs").test("")).toBe(false);
        });
    });

    // ----------------------------------------------------------
    // PARAM
    // ----------------------------------------------------------

    describe("param (:name)", () => {
        test("match angka", () => {
            expect(new Pattern(":id").test("123")).toBe(true);
        });

        test("match string", () => {
            expect(new Pattern(":id").test("abc")).toBe(true);
        });

        test("nggak match string kosong", () => {
            expect(new Pattern(":id").test("")).toBe(false);
        });

        test("nggak match slash", () => {
            expect(new Pattern(":id").test("a/b")).toBe(false);
        });

        test("match spasi", () => {
            expect(new Pattern(":id").test("a b")).toBe(true);
        });

        test("groups ke-set", () => {
            const result = new Pattern(":id").exec("123");
            expect(toObjectLike(result.groups).id).toBe("123");
        });

        test("multiple params", () => {
            const result = new Pattern(":a-:b").exec("x-y");
            expect(toObjectLike(result.groups).a).toBe("x");
            expect(toObjectLike(result.groups).b).toBe("y");
        });

        test("multiple params — salah satu kosong", () => {
            expect(new Pattern(":a-:b").test("x-")).toBe(false);
        });
    });

    // ----------------------------------------------------------
    // WILDCARD
    // ----------------------------------------------------------

    describe("wildcard (*)", () => {
        test("match apapun", () => {
            expect(new Pattern("*").test("anything")).toBe(true);
        });

        test("match string kosong", () => {
            expect(new Pattern("*").test("")).toBe(true);
        });

        test("match slash", () => {
            expect(new Pattern("*").test("a/b/c")).toBe(true);
        });

        test("prefix", () => {
            expect(new Pattern("file*").test("file.txt")).toBe(true);
            expect(new Pattern("file*").test("file")).toBe(true);
        });

        test("suffix", () => {
            expect(new Pattern("*.txt").test("file.txt")).toBe(true);
            expect(new Pattern("*.txt").test(".txt")).toBe(true);
            expect(new Pattern("*.txt").test("file.md")).toBe(false);
        });
    });

    // ----------------------------------------------------------
    // CAMPURAN
    // ----------------------------------------------------------

    describe("campuran", () => {
        test("static + param", () => {
            const result = new Pattern("file-:id").exec("file-123");
            expect(toObjectLike(result.groups).id).toBe("123");
        });

        test("static + param — nggak match", () => {
            expect(new Pattern("file-:id").test("file-")).toBe(false);
        });

        test("param + wildcard", () => {
            const result = new Pattern(":id-*").exec("123-anything");
            expect(toObjectLike(result.groups).id).toBe("123");
        });
    });

    // ----------------------------------------------------------
    // ESCAPE KARAKTER SPESIAL
    // ----------------------------------------------------------

    describe("escape karakter spesial", () => {
        test("dot", () => {
            expect(new Pattern("a.b").test("a.b")).toBe(true);
            expect(new Pattern("a.b").test("axb")).toBe(false);
        });

        test("plus", () => {
            expect(new Pattern("a+b").test("a+b")).toBe(true);
            expect(new Pattern("a+b").test("aaab")).toBe(false);
        });

        test("parentheses", () => {
            expect(new Pattern("(x)").test("(x)")).toBe(true);
            expect(new Pattern("(x)").test("x")).toBe(false);
        });

        test("bracket", () => {
            expect(new Pattern("[x]").test("[x]")).toBe(true);
            expect(new Pattern("[x]").test("x")).toBe(false);
        });

        test("dollar", () => {
            expect(new Pattern("$x").test("$x")).toBe(true);
        });

        test("caret", () => {
            expect(new Pattern("^x").test("^x")).toBe(true);
        });
    });

    // ----------------------------------------------------------
    // exec()
    // ----------------------------------------------------------

    describe("exec()", () => {
        test("return match object", () => {
            const result = new Pattern(":id").exec("123");
            expect(result !== null).toBe(true);
            expect(result[0]).toBe("123");
            expect(result.index).toBe(0);
            expect(result.input).toBe("123");
        });

        test("return null kalau nggak match", () => {
            const result = new Pattern("blogs").exec("users");
            expect(result).toBe(null);
        });

        test("groups ke-set", () => {
            const result = new Pattern(":id").exec("123");
            expect(toObjectLike(result.groups)).toEqual({ id: "123" });
        });

        test("groups kosong untuk static", () => {
            const result = new Pattern("blogs").exec("blogs");
            expect(result.groups).toBe(undefined);
        });
    });

    // ----------------------------------------------------------
    // test()
    // ----------------------------------------------------------

    describe("test()", () => {
        test("return boolean", () => {
            expect(new Pattern(":id").test("123")).toBe(true);
            expect(new Pattern(":id").test("a/b")).toBe(false);
        });
    });

    // ----------------------------------------------------------
    // REGEX PROPERTY
    // ----------------------------------------------------------

    describe("regex property", () => {
        test("non-enumerable", () => {
            const p = new Pattern(":id");
            expect(Object.keys(p)).toEqual([]);
        });

        test("non-configurable? no — configurable", () => {
            const p = new Pattern(":id");
            const desc = Object.getOwnPropertyDescriptor(p, "regex");
            expect(desc.configurable).toBe(true);
            expect(desc.enumerable).toBe(false);
        });
    });

    describe("Edge Case", () => {
        test("duplicate named group — throw", () => {
            expect(() => new Pattern(":id-:id")).toThrow("Duplicate capture group name");
        });

        test("named group mulai angka — throw", () => {
            expect(() => new Pattern(":1")).toThrow("Invalid capture group name");
        });

        test("wildcard di tengah — match", () => {
            expect(new Pattern("a*b*c").test("aXbYc")).toBe(true);
            expect(new Pattern("a*b*c").test("abc")).toBe(true);
            expect(new Pattern("a*b*c").test("aXc")).toBe(false);
        });

        test("pattern kosong — match string kosong doang", () => {
            expect(new Pattern("").test("")).toBe(true);
            expect(new Pattern("").test("a")).toBe(false);
        });

        test(":id nggak match a/b — return null", () => {
            expect(new Pattern(":id").exec("a/b")).toBe(null);
        });

        test("pattern ':' — match ':' doang", () => {
            expect(new Pattern(":").test(":")).toBe(true);
            expect(new Pattern(":").test("a")).toBe(false);
        });
    });
});
