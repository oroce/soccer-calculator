function leftpad (value, len, fill) {
  if (fill == null) {
    fill = '0';
  }
  if (typeof fill !== 'string') {
    fill += '';
  }
  return (Array(len).join(fill) + value).slice(len * -1);
}
function yyyymmdd (date) {
  var d = new Date(date);
  return [
    d.getFullYear(),
    leftpad(d.getMonth() + 1, 2),
    leftpad(d.getDate(), 2)
  ].join('-');
}

function formatParticipations (participations) {
  // console.log('participations=', JSON.stringify(participations))
  var dateList = participations.shift();
  var numOfPplList = participations.shift();
  var result = {};
  var people = {};
  for (var i = 0; i < participations.length; i++) {
    var participation = participations[i];
    var person = participation[0];
    people[person] = true;
    if (!result[person]) {
      result[person] = {};
    }
    for (var j = 1; j < participation.length; j++) {
      var numOfPpl = numOfPplList[j];
      var date = yyyymmdd(dateList[j]);
      // console.log('parsed %s as %s', dateList[j], date)
      var rsvp = participation[j];
      if (rsvp !== 'igen') {
        continue;
      }
      result[person][date] = {
        numOfPpl: numOfPpl
      };
    }
  }

  return {
    participations: result,
    people: Object.keys(people)
  };
}

function csv (obj) {
  var headers = [];
  var data = Object.keys(obj)
    .map(function (name) {
      var ppl = obj[name];
      var pplList = Object.keys(ppl);
      for (var i = 0; i < pplList.length; i++) {
        var person = pplList[i];
        if (person === 'sum') {
          continue;
        }
        if (~headers.indexOf(person)) {
          continue;
        }
        headers.push(person);
      }
      var row = [];
      row[0] = name;
      // console.log('ppl of %s=', name, ppl)0;
      row[1] = ppl.sum;
      // console.log('headers=', headers);
      for (var j = 0; j < headers.length; j++) {
        row[j + 2] = ppl[headers[j]] || '';
      }
      return row;
    });
  return [
    ['', 'sum'].concat(headers)
  ]
    .concat(data);
}
function groupFulfillments (fulfillments) {
  return (fulfillments || []).reduce(function (obj, row) {
    // console.log('row=', row);
    var from = row.shift();
    var to = row.shift();
    var amount = row.shift();
    if (!obj[from]) {
      obj[from] = {};
    }
    if (!obj[from][to]) {
      obj[from][to] = 0;
    }
    obj[from][to] += amount;
    return obj;
  }, {});
}
function groupParticipationsByDate (participations) {
  // console.log('participations', participations)
  return Object.keys(participations)
    .reduce(function (grp, name) {
      var item = participations[name];
      var dates = Object.keys(item);
      for (var i = 0; i < dates.length; i++) {
        if (!grp[dates[i]]) {
          grp[dates[i]] = {
            participators: [],
            numOfPpl: item[dates[i]].numOfPpl
          };
        }
        grp[dates[i]].participators.push(name);
      }
      return grp;
    }, {});
}

function calculateObligations (pitchPayouts, participationByDate) {
  var obligations = {};

  for (var i = 0; i < pitchPayouts.length; i++) {
    var payout = pitchPayouts[i];
    if (!payout || payout[0] === '') {
      continue;
    }
    var payer = payout[0];
    var date = yyyymmdd(payout[1]);
    var amount = +payout[2];

    if (!obligations[payer]) {
      obligations[payer] = {};
    }

    var event = participationByDate[date];
    // console.log('date', date, Object.keys(participationByDate));
    var participators = event.participators;
    var numOfPpl = event.numOfPpl;
    // console.log('date is =', date, amount, numOfPpl);
    var costPerPerson = amount / numOfPpl;
    for (var j = 0; j < participators.length; j++) {
      var participator = participators[j];
      if (participator === payer) {
        continue;
      }
      if (!obligations[payer][participator]) {
        obligations[payer][participator] = 0;
      }
      obligations[payer][participator] += costPerPerson;
    }
  }

  return obligations;
}

function optimizeObligations (obligations, wiresHash, people) {
  var correctedObligations = {};
  // console.log('Ppl=', people)
  for (var i = 0; i < people.length; i++) {
    var person1 = people[i];
    for (var j = 0; j < people.length; j++) {
      var person2 = people[j];
      if (person1 === person2 || !person1 || !person2) {
        continue;
      }
      var thisObligation = (obligations[person1] || {})[person2] || 0;
      var otherObligation = (obligations[person2] || {})[person1];
      // console.log('this=%s, that=%s between %s-%s', thisObligation, otherObligation, person1, person2);
      if (!thisObligation) {
        // console.log('no obligation to %s from %s', person1, person2);
        continue;
      }
      if (otherObligation > thisObligation) {
        // console.log('the other obligation is more, lets solve that to %s from %s', person1, person2);
        continue;
      }
      if (!correctedObligations[person1]) {
        correctedObligations[person1] = {};
      }
      var wired = 0;
      if (wiresHash[person2] && wiresHash[person2][person1]) {
        wired = wiresHash[person2][person1];
      }
      var wiredBack = 0;
      if (wiresHash[person1] && wiresHash[person1][person2]) {
        wiredBack = wiresHash[person1][person2];
      }
      // console.log('wired from %s to %s', person2, person1, wired)
      correctedObligations[person1][person2] = thisObligation - (otherObligation || 0) - wired + wiredBack;
    }
  }
  return correctedObligations;
}
function decorateObligations (correctedObligations) {
  var decoratedObligations = {};
  for (var i in correctedObligations) {
    var list = correctedObligations[i];
    var sum = Object.keys(list)
      .reduce(function (sum, name) {
        return sum + list[name];
      }, 0);

    decoratedObligations[i] = Object.assign({}, correctedObligations[i], {
      sum: sum
    });
  }
  return decoratedObligations;
}
function calculate (
  participations,
  pitchPayouts,
  fulfillments
) {
  var formatted = formatParticipations(participations);
  var formattedParticipations = formatted.participations;
  var people = formatted.people;

  // console.log('formattedParticipations=', formattedParticipations);

  var wiresHash = groupFulfillments(fulfillments);

  // console.log('wiresHash', wiresHash);
  // console.log('pitchPayouts', pitch);

  var participationByDate = groupParticipationsByDate(formattedParticipations);
  // console.log('participationByDate=', participationByDate);
  var obligations = calculateObligations(pitchPayouts, participationByDate);

  var correctedObligations = optimizeObligations(obligations, wiresHash, people);

  var decoratedObligations = decorateObligations(correctedObligations);
  // console.log('obligations=\n', decoratedObligations);
  // return;

  return csv(decoratedObligations);
}
module.exports = calculate;
module.exports.yyyymmdd = yyyymmdd;
module.exports.leftpad = leftpad;
module.exports.formatParticipations = formatParticipations;
module.exports.csv = csv;
module.exports.groupFulfillments = groupFulfillments;
module.exports.groupParticipationsByDate = groupParticipationsByDate;
module.exports.calculateObligations = calculateObligations;
module.exports.optimizeObligations = optimizeObligations;
module.exports.decorateObligations = decorateObligations;
