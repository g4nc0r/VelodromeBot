const axios = require('axios');
const _ = require('lodash');
require('dotenv').config();

const options = {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'X-API-KEY': process.env.QUIXOTIC_API_KEY
  }
};

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

const getVeNftListings = async (url, options, data) => {
  data = data || {};

  await axios.get(url, options).then(response => {
    _.mergeWith(data, response.data, customizer);
  
    if (response.data.next != null) {
      return getVeNftListings(response.data.next, options, data)
    }
  });
  return data.results;
}

const activeListings = (listings) => {

  let activeListings = [];
  let activeListingsNum = 0;

  for(let i=0; i < listings.length; i++) {
    if (listings[i].order_status === 'active') {
      if (listings[i].order_type === 'fixed_price') {

        activeListings.push({
          token_id: listings[i].token.token_id,
          start_price: listings[i].start_price,
          end_price: listings[i].end_price,
          start_time: listings[i].start_time,
          end_time: listings[i].end_time
        })

      }
      activeListingsNum = activeListingsNum+1;
    }
  }
  return activeListings;
}

const getActiveListings = async () => {

  let filteredListings = [];

  await getVeNftListings('https://api.quixotic.io/api/v1/collection/0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26/activity/?event=LI', options)
  .then(data => {
    filteredListings = activeListings(data);
  })

  return filteredListings;
}

module.exports = { getVeNftListings, activeListings, getActiveListings };