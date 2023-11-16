/*eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const fs = require('fs-extra')
const Airtable = require('airtable')
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appK7j84d1AB9WDjw')

const alphabet = []
base('Alphabet')
  .select({
    // Selecting the first 3 records in Grid view:
    maxRecords: 50,
    view: 'Grid view',
  })
  .eachPage(
    function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function (record) {
        console.log('Retrieved', record.get('id'))
        alphabet.push({
          id: record.get('id'),
          caps: record.get('caps'),
          description_fr: record.get('description_fr'),
          description_en: record.get('description_en'),
          type: record.get('type'),
          hideInKeyboard: record.get('hideInKeyboard') === 'true',
        })
      })

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage()
    },
    function done(err) {
      if (err) {
        console.error(err)
        return
      }
      fs.writeFileSync(`./utils/data/alphabet.json`, JSON.stringify(alphabet, null, 2))
    }
  )
