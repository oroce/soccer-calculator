const c = require('./');
describe('unit', function() {
  it('', function() {

  });
});

/* */
const fixture = JSON.parse(require('fs').readFileSync('./data.json'));

describe('integration', function() {
  it('should work the snapshot', function() {
    const r = c(
      fixture.participations,
      fixture.pitchPayouts,
      fixture.fulfillments
    );
    console.log(r);
    // r.should.eql(
    //   // TODO
    // );
  });
});
/* */
