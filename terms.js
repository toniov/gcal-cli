const moment = require('moment');

module.exports.fixedTerms = {
  today () {
    const timeMin = moment().startOf('day').format();
    const timeMax = moment(timeMin).add(1, 'day').format();
    return [timeMin, timeMax];
  },
  yesterday () {
    const timeMin = moment().subtract(1, 'day').startOf('day').format();
    const timeMax = moment(timeMin).add(1, 'day').format();
    return [timeMin, timeMax];
  },
  ['the day before yesterday'] () {
    const timeMin = moment().subtract(2, 'day').startOf('day').format();
    const timeMax = moment(timeMin).add(1, 'day').format();
    return [timeMin, timeMax];
  },
  tomorrow () {
    const timeMin = moment().add(1, 'day').startOf('day').format();
    const timeMax = moment(timeMin).add(1, 'day').format();
    return [timeMin, timeMax];
  },
  ['the day after tomorrow'] () {
    const timeMin = moment().add(2, 'day').startOf('day').format();
    const timeMax = moment(timeMin).add(1, 'day').format();
    return [timeMin, timeMax];
  },
  ['this month'] () {
    const timeMin = moment().startOf('month').format();
    const timeMax = moment(timeMin).add(1, 'month').format();
    return [timeMin, timeMax];
  },
  ['last month'] () {
    const timeMin = moment().subtract(1, 'month').startOf('month').format();
    const timeMax = moment(timeMin).add(1, 'month').format();
    return [timeMin, timeMax];
  },
  ['next month'] () {
    const timeMin = moment().add(1, 'month').startOf('month').format();
    const timeMax = moment(timeMin).add(1, 'month').format();
    return [timeMin, timeMax];
  },
  ['this year'] () {
    const timeMin = moment().startOf('year').format();
    const timeMax = moment(timeMin).add(1, 'year').format();
    return [timeMin, timeMax];
  },
  ['last year'] () {
    const timeMin = moment().subtract(1, 'year').startOf('year').format();
    const timeMax = moment(timeMin).add(1, 'year').format();
    return [timeMin, timeMax];
  },
  ['next year'] () {
    const timeMin = moment().add(1, 'year').startOf('year').format();
    const timeMax = moment(timeMin).add(1, 'year').format();
    return [timeMin, timeMax];
  }
};

module.exports.calculateTerm = (term) => {
  if (term.length === 4) {
    const timeMin = moment(term, 'YYYY').startOf('year').format();
    const timeMax = moment(timeMin).add(1, 'year').format();
    return [timeMin, timeMax];
  } else if (term.length === 6) {
    const timeMin = moment(term, 'YYYYMM').startOf('month').format();
    const timeMax = moment(timeMin).add(1, 'month').format();
    return [timeMin, timeMax];
  } else if (term.length === 8) {
    const timeMin = moment(term, 'YYYYMMDD').startOf('day').format();
    const timeMax = moment(timeMin).add(1, 'day').format();
    return [timeMin, timeMax];
  }
  return [null, null];
};
