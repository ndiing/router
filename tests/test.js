const util = require("util");
const { parseUrl } = require("../src/util");

const samplesQuery = [
    // === dasar ===
    "",
    "a=1",
    "a=1&b=2",
    "a=1&b=2&c=3",

    // === nilai kosong / nama kosong ===
    "a=",
    "=1",
    "=",
    "a",
    "a&b",

    // === duplikat (array) ===
    "a=1&a=2",
    "a=1&a=2&a=3",
    "a=1&b=2&a=3",

    // === `=` di value ===
    "a=b=c",
    "a=b=c=d",
    "a==b",
    "a===",

    // === `&` berlebih ===
    "&&a=1",
    "a=1&&b=2",
    "a=1&&&b=2",
    "&",
    "&&",
    "a=1&",

    // === encoding ===
    "a=hello%20world",
    "a=hello+world",
    "a=%26%3D%3F", // & = ?
    "a=%E2%9C%93", // ✓ (unicode)
    "a=%ZZ", // invalid percent
    "a=%", // invalid percent
    "a=%2", // invalid percent (truncated)

    // === karakter khusus ===
    "a[]=1&a[]=2", // PHP-style array (nama "a[]")
    "a.b=1",
    "a b=1", // spasi mentah (bukan encoded)
    "a=1;b=2", // semicolon (bukan separator di modern spec)

    // === protopollution ===
    "__proto__=x",
    "constructor=x",
    "prototype=x",
    "__proto__[x]=1",

    // === kombinasi ===
    "a=1&a=2&b=&c",
    // "?a=1", // tanda ? ikut (biasanya sudah dipisah parseUrl)
    "a=1#frag", // fragment ikut (biasanya sudah dipisah)
];
const samplesUrl = [
    // === dasar ===
    "/",
    "/users",
    "/users/123",
    "/users/123/posts",

    // === query string ===
    "/?a=1",
    "/users?a=1",
    "/users/123?a=1&b=2",
    "/users?a=",
    "/users?a",
    "/users?a=1&a=2",
    "/users?a=1&a=2",

    // === fragment ===
    "/#top",
    "/users#top",
    "/users/123#section-2",

    // === query + fragment ===
    "/?a=1#top",
    "/users?a=1#top",
    "/users/123?a=1&b=2#section",

    // === `?` tanpa path ===
    "?a=1",
    "?a=1#top",
    "?",

    // === `#` tanpa path ===
    "#top",
    "#",

    // === `?` dan `#` kosong ===
    "/?",
    "/#",
    "/?#",
    "/?#top",
    "/?#a=1",

    // === multiple `?` dan `#` ===
    "/users?a=1?b=2",
    "/users?a=1#top#bottom",
    "/users?a=1?b=2#top#bottom",
    "/users??a=1",
    "/users##top",

    // === query string dengan karakter khusus ===
    "/users?a=hello%20world",
    "/users?a=hello+world",
    "/users?a=%26%3D%3F",
    "/users?a=%ZZ",

    // === path dengan karakter encoded ===
    "/users%2F123", // %2F = /
    "/users/hello%20world",
    "/caf%C3%A9", // café

    // === trailing slash ===
    "/users/",
    "/users/123/",
    "/users//123", // double slash

    // === asterisk (OPTIONS *) ===
    "*",

    // === URL absolut (biasanya tidak muncul di req.url, tapi buat jaga-jaga) ===
    "http://example.com/users?a=1",
    "https://example.com/users/123?a=1#top",

    // === path aneh ===
    "//users", // protocol-relative style
    "/./users", // dot segment
    "/../users", // dot-dot segment
];

function bench(title, callback) {
    console.log(title);
    for (let index = 0; index < 1_000; index++) {
        callback();
    }
    const start = performance.now();
    for (let index = 0; index < 1_000_000; index++) {
        callback();
    }
    const end = performance.now();
    const duration = (end - start) / 1000;
    console.log(duration.toFixed(2) + "s");
}
