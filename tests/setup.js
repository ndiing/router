// const path = require('path')
// require("@ndiinginc/test")(path.resolve('tests'),{verbose:true});
require("@ndiinginc/test")();

// node --require ./tests/setup.js --test --experimental-test-coverage

// 2026-10-20 06:42:34
/* 
test result
 pass  \\app.test.js
 pass  \\cache.test.js
 pass  \\cors.test.js
 pass  \\json.test.js
 pass  \\node.test.js
 pass  \\router.test.js
 pass  \\util.test.js
test suites: passed 7, total 7
tests:       passed 211, total 211
time:        1.64s
ran all test suites.
✔ tests\util.test.js (1864.6962ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2068.3905
ℹ start of coverage report
ℹ ----------------------------------------------------------------
ℹ file            | line % | branch % | funcs % | uncovered lines
ℹ ----------------------------------------------------------------
ℹ src             |        |          |         | 
ℹ  app.js         | 100.00 |    87.88 |  100.00 | 
ℹ  cache.js       | 100.00 |   100.00 |  100.00 | 
ℹ  index.js       | 100.00 |   100.00 |  100.00 | 
ℹ  middleware     |        |          |         | 
ℹ   cors.js       | 100.00 |    98.08 |  100.00 | 
ℹ   json.js       | 100.00 |   100.00 |  100.00 | 
ℹ  node.js        | 100.00 |   100.00 |  100.00 | 
ℹ  request.js     | 100.00 |   100.00 |  100.00 | 
ℹ  response.js    | 100.00 |    80.00 |  100.00 | 
ℹ  router.js      | 100.00 |   100.00 |  100.00 | 
ℹ  util.js        | 100.00 |   100.00 |  100.00 | 
ℹ tests           |        |          |         | 
ℹ  setup.js       | 100.00 |   100.00 |  100.00 | 
ℹ ----------------------------------------------------------------
ℹ all files       | 100.00 |    97.40 |  100.00 | 
ℹ ----------------------------------------------------------------
ℹ end of coverage report
*/
