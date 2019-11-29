const api = require('./src/api');

const NEW_SINGLE_EVENT = {
  'calendarId': 'primary',
  'resource': {
    'summary': 'Single event',
    'description': 'Single Event created by gcal-cli with api',
    'start': {
      'dateTime': '2018-09-08T15:00:00+02:00'
    },
    'end': {
      'dateTime': '2018-09-08T17:00:00+02:00'
    }
  }
};

const NEW_BULK_EVENTS = [{
  'calendarId': 'primary',
  'resource': {
    'summary': 'Bulk event',
    'description': 'Single Event created by gcal-cli with api',
    'start': {
      'dateTime': '2018-09-08T15:00:00+02:00'
    },
    'end': {
      'dateTime': '2018-09-08T17:00:00+02:00'
    }
  }
}, {
  'calendarId': 'primary',
  'resource': {
    'summary': 'Bulk event',
    'description': 'Bulk Event created by gcal-cli with api',
    'start': {
      'dateTime': '2018-09-08T18:00:00+02:00'
    },
    'end': {
      'dateTime': '2018-09-08T19:00:00+02:00'
    }
  }
}];

async function insert (){
  const result = await api.insert(NEW_SINGLE_EVENT);

  console.log(result);
}

async function bulk (){
  const result = await api.bulk(NEW_BULK_EVENTS);

  console.log(result);
}

insert();
bulk();
