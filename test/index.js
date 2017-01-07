import assert from 'assert';
import request from 'request';
import chai from 'chai';

import '../lib/server.js';

let testUri = `http://127.0.0.1:${process.env.PORT || 3000}`

describe('Testing Node Server', () => {
  it('should return 200', done => {
    request({
        url: testUri,
        method: "GET",
    }, (err, res, body) => {
        assert.equal(200, res.statusCode);
        done();
    });
  });
});
