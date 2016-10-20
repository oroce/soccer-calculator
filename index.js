function leftpad(value, len, fill) {
  if (!fill) {
    fill = '0';
  }
  if (typeof fill != 'string') {
    fill += '';
  }
  return (Array(len).join(fill) + value).slice(len * -1);
}
function yyyymmdd(date) {
  var d = new Date(date);
  return [
    d.getFullYear(),
    leftpad(d.getMonth() + 1, 2),
    leftpad(d.getDate(), 2)
  ].join('-');
}

function formatParticipations(participations) {
  console.log('participations=', JSON.stringify(participations))
  var dateList = participations.shift();
  var numOfPplList = participations.shift();
  var result = {};
  var people = {};
  for(var i = 0; i < participations.length; i++) {
    var participation = participations[i];
    var person = participation[0];
    people[person] = true;
    if (!result[person]) {
      result[person] = {};
    }
    for(var j = 1; j < participation.length; j++) {
      var numOfPpl = numOfPplList[j];
      var date = yyyymmdd(dateList[j]);
      var rsvp = participation[j];
      if (rsvp != 'igen') {
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

function csv(obj) {
  var headers = [];
  var data = Object.keys(obj)
    .map(function(name) {
      var ppl = obj[name];
      var pplList = Object.keys(ppl);
      for (var i = 0; i < pplList.length; i++) {
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
      console.log('ppl=', ppl);
      row[1] = ppl.sum;
      //console.log('headers=', headers);
      for (var i = 0; i < headers.length; i++) {
        row[i + 2] = ppl[headers[i]] || '';
      }
      return row;
    });

  return [
    ['', 'sum'].concat(headers)
  ]
    .concat(data);
}
module.exports = function(
  participations,
  pitchPayouts,
  fulfillments
) {
  var formatted = formatParticipations(participations);
  var formattedParticipations = formatted.participations;
  var people = formatted.people;

  console.log('formattedParticipations=', formattedParticipations);

  var wiresHash = (fulfillments||[]).reduce(function(obj, row) {
    var from = row.shift();
    var to = row.shift();
    var amount = row.shift();
    var key = from + '-' + to
    if (!obj[from]) {
      obj[from] = {};
    }
    if (!obj[from][to]) {
      obj[from][to] = 0;
    }
    obj[from][to] += amount;
    return obj;
  }, {});

  console.log('wiresHash', wiresHash);
  //console.log('pitchPayouts', pitch);

  var participationByDate = Object.keys(formattedParticipations)
    .reduce(function(grp, name) {
      var item = formattedParticipations[name];
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
  console.log('participationByDate=', participationByDate);
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
    var participators = event.participators;
    var numOfPpl = event.numOfPpl;
    console.log('date is =', date, amount, numOfPpl);
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
  var correctedObligations = {};
  console.log('Ppl=', people)
  for (var i = 0; i < people.length; i++) {
    var person1 = people[i];
    for (var j = 0; j < people.length; j++) {
      var person2 = people[j];
      if (person1 === person2) {
        continue;
      }
      var thisObligation = (obligations[person1] || {})[person2];
      var otherObligation = (obligations[person2] || {})[person1];
      console.log('this=%s, that=%s', thisObligation, otherObligation);
      if (!thisObligation) {
        continue;
      }
      if (otherObligation > thisObligation) {
        continue;
      }
      if (!correctedObligations[person1]) {
        correctedObligations[person1] = {};
      }
      var wired = 0;
      if (wiresHash[person1] && wiresHash[person1][person2]) {
        wired = wiresHash[person1][person2];
      }
      correctedObligations[person1][person2] = thisObligation - (otherObligation || 0) - wired;

    }
  }
  for (var i in correctedObligations) {
    var list = correctedObligations[i];
    var sum = Object.keys(list)
      .reduce(function(sum, name) {
        return sum + list[name];
      }, 0);

    correctedObligations[i].sum = sum;
  }
  console.log('obligations=', correctedObligations);
  //return;

  return csv(correctedObligations);
}
