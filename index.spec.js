const c = require('./');
const yyyymmdd = c.yyyymmdd;
const leftpad = c.leftpad;
const formatParticipations = c.formatParticipations;
const groupFulfillments = c.groupFulfillments;
const groupParticipationsByDate = c.groupParticipationsByDate;
const calculateObligations = c.calculateObligations;
const optimizeObligations = c.optimizeObligations;
const decorateObligations = c.decorateObligations;
const csv = c.csv;
// describe('integration', function() {
//   it('should work the snapshot', function() {
//     const fixture = JSON.parse(require('fs').readFileSync('./data.json'));
//     const r = c(
//       fixture.participations,
//       fixture.pitchPayouts,
//       fixture.fulfillments
//     );
//     console.log(r);
//     // r.should.eql(
//     //   // TODO
//     // );
//   });
// });

describe('yyyymmdd', function() {
  it('should format 2016-01-01', function() {
    yyyymmdd(new Date('Fri Jan 01 2016 01:00:00'))
      .should.eql('2016-01-01');
  });

  it('should format 2016-10-01', function() {
    yyyymmdd(new Date('Fri Oct 01 2016 01:00:00'))
      .should.eql('2016-10-01');
  });

  it('should format 2016-10-10', function() {
    yyyymmdd(new Date('Fri Oct 10 2016 01:00:00'))
      .should.eql('2016-10-10');
  });
});

describe('leftpad', function() {
  it('should prepend zero by default', function() {
    leftpad('foo', 4).should.eql('0foo');
  });

  it('should not prepend anything if text is longer then len', function() {
    leftpad('foo', 3).should.eql('foo');
    leftpad('foo', 2).should.eql('oo');
  });

  it('should work with non string values', function() {
    leftpad(1234, 5).should.eql('01234');
  });

  it('should prepend with the supplied character', function() {
    leftpad('foo', 5, '-').should.eql('--foo');
  });

  it('should work with non string fillings', function() {
    leftpad('foo', 5, 0).should.eql('00foo');
  });
});

describe('formatParticipations', function() {
  it('should transform the input', function() {
    var ret = formatParticipations([
      [
        '',
        '2015-11-04T12:00:00.000Z',
        '2015-11-11T12:00:00.000Z',
        '2015-11-18T12:00:00.000Z',
        '2015-11-25T12:00:00.000Z'
      ],
      [
        'dummy text',
        '4',
        '3',
        '2',
        '4'
      ],
      [
        'John Smith',
        'igen',
        'igen',
        '',
        'igen'
      ],
      [
        'Jon Snow',
        'igen',
        'nem',
        'nem',
        'igen'
      ],
      [
        'Peter Black',
        'igen',
        'igen',
        'igen',
        'igen'
      ],
      [
        'Steve McFarlane',
        'igen',
        'igen',
        'igen',
        'igen'
      ]
    ]);

    ret.people.should.eql([
      'John Smith',
      'Jon Snow',
      'Peter Black',
      'Steve McFarlane'
    ]);
    ret.participations.should.eql({
      'John Smith': {
        '2015-11-04': { numOfPpl: '4' },
        '2015-11-11': { numOfPpl: '3' },
        '2015-11-25': { numOfPpl: '4' }
      },
      'Jon Snow': {
        '2015-11-04': { numOfPpl: '4' },
        '2015-11-25': { numOfPpl: '4' }
      },
      'Peter Black': {
        '2015-11-04': { numOfPpl: '4' },
        '2015-11-11': { numOfPpl: '3' },
        '2015-11-18': { numOfPpl: '2' },
        '2015-11-25': { numOfPpl: '4' }
      },
      'Steve McFarlane': {
        '2015-11-04': { numOfPpl: '4' },
        '2015-11-11': { numOfPpl: '3' },
        '2015-11-18': { numOfPpl: '2' },
        '2015-11-25': { numOfPpl: '4' }
      }
    });
  });
});



describe('groupFulfillments', function() {
  it('should group fulfillments', function() {
    groupFulfillments([
      ['Jon', 'Steve', 1200],
      ['Pete', 'Steve', 1.4],
      ['Jon', 'Pete', 200],
      ['Steve', 'Pete', 1900]
    ]).should.eql({
      'Jon': {
        'Steve': 1200,
        'Pete': 200
      },
      'Pete': {
        'Steve': 1.4
      },
      'Steve': {
        'Pete': 1900
      }
    });
  });

  it('should sum multiple fulfillments', function() {
    groupFulfillments([
      ['Jon', 'Steve', 1200],
      ['Pete', 'Steve', 1.4],
      ['Jon', 'Steve', 200],
      ['Steve', 'Pete', 1900]
    ]).should.eql({
      'Jon': {
        'Steve': 1400
      },
      'Pete': {
        'Steve': 1.4
      },
      'Steve': {
        'Pete': 1900
      }
    })
  });
});

describe('groupParticipationsByDate', function() {
  it('should group participations by date', function() {
    groupParticipationsByDate({
      'John Smith': {
        '2015-11-05': { numOfPpl: '4' },
        '2015-11-12': { numOfPpl: '3' },
        '2015-11-26': { numOfPpl: '4' }
      },
      'Jon Snow': {
        '2015-11-05': { numOfPpl: '4' },
        '2015-11-26': { numOfPpl: '4' }
      },
      'Peter Black': {
        '2015-11-05': { numOfPpl: '4' },
        '2015-11-12': { numOfPpl: '3' },
        '2015-11-19': { numOfPpl: '2' },
        '2015-11-26': { numOfPpl: '4' }
      },
      'Steve McFarlane': {
        '2015-11-05': { numOfPpl: '4' },
        '2015-11-12': { numOfPpl: '3' },
        '2015-11-19': { numOfPpl: '2' },
        '2015-11-26': { numOfPpl: '4' }
      }
    }).should.eql({
      '2015-11-05': {
        participators: [
          'John Smith', 'Jon Snow', 'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '4'
      },
      '2015-11-12': {
        participators: [
          'John Smith', 'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '3'
      },
      '2015-11-26': {
        participators: [
          'John Smith', 'Jon Snow', 'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '4'
      },
      '2015-11-19': {
        participators: [
          'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '2'
      }
    });
  });
});

describe('calculateObligations', function() {
  it('should calculate obligations', function() {
    var pitchPayouts = [
      ['John Smith', new Date('2015-11-05'), 200],
      ['Jon Snow', new Date('2015-11-12'), 300],
      ['John Smith', new Date('2015-11-26'), 141],
      ['Peter Black', new Date('2015-11-19'), 200],
    ];
    var participations = {
      '2015-11-05': {
        participators: [
          'John Smith', 'Jon Snow', 'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '4'
      },
      '2015-11-12': {
        participators: [
          'John Smith', 'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '3'
      },
      '2015-11-26': {
        participators: [
          'John Smith', 'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '3'
      },
      '2015-11-19': {
        participators: [
          'Peter Black', 'Steve McFarlane'
        ],
        numOfPpl: '2'
      }
    };
    var expectation = {
      'John Smith': {
        'Jon Snow': 50, // first and third part
        'Peter Black': 50 + 47, // first and third part
        'Steve McFarlane': 50 + 47 // first and third part
      },
      'Jon Snow': {
        'John Smith': 100,
        'Peter Black': 100,
        'Steve McFarlane': 100,
      },
      'Peter Black': {
        'Steve McFarlane': 100
      }
    };

    calculateObligations(pitchPayouts, participations)
      .should.eql(expectation);
  });

  it('should handle when the payer is unknown', function() {
    (function() {
      calculateObligations([null, ['']])
    }).should.not.throw();
  });
});

describe('optimizeObligations', function() {
  it('should optimize the obligations', function() {
    var obligations = {
      'John Smith': {
        'Jon Snow': 50,
        'Peter Black': 97,
        'Steve McFarlane': 97
      },
      'Jon Snow': {
        'John Smith': 100,
        'Peter Black': 100,
        'Steve McFarlane': 100,
      },
      'Peter Black': {
        'Steve McFarlane': 100,
        'John Smith': 150
      }
    };
    var wires = {
      'Jon Snow': {
        'John Smith': 200
      },
      'Peter Black': {
        'Jon Snow': 50
      },
      'Steve McFarlane': {
        'Jon Snow': 100
      }
    };
    var people = ['John Smith', 'Jon Snow', 'Peter Black', 'Steve McFarlane'];
    var expectation = {
      'John Smith': {
        'Steve McFarlane': 97
      },
      'Jon Snow': {
        'John Smith': 250, // actually this is 50 but Jon Snow wired some money to John Smith
        'Peter Black': 50,
        'Steve McFarlane': 0
      },
      'Peter Black': {
        'Steve McFarlane': 100,
        'John Smith': 53
      }
    };
    optimizeObligations(
      obligations,
      wires,
      people
    ).should.eql(expectation);

  });
});

describe('decorateObligations', function() {
  it('should decorate obligations', function() {
    decorateObligations({
      'Jon': {
        'Steve': 100,
        'Stan': 50,
      },
      'Steve': {
        'Stan': 30
      }
    }).should.eql({
      'Jon': {
        'Steve': 100,
        'Stan': 50,
        'sum': 150
      },
      'Steve': {
        'Stan': 30,
        'sum': 30
      }
    });
  });
});

describe('csv', function() {
  it('should generate csv', function() {
    csv({
      'Jon': {
        'Steve': 100,
        'Stan': 50,
        'sum': 150
      },
      'Steve': {
        'Stan': 30,
        'sum': 30
      },
      'Stan': {
        'Jon': 20,
        'sum': 20
      }
    })
      .should.eql([
        ['', 'sum', 'Steve', 'Stan', 'Jon'],
        ['Jon', 150, 100, 50],
        ['Steve', 30, '', 30],
        ['Stan', 20, '', '', 20]
      ]);
  });
});
