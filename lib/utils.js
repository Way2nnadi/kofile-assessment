import * as feesJson from '../fees.json';
import * as ordersJson from '../orders.json';


/*
  Define Variables
*/
let orders = ordersJson.default;
let rawFees = feesJson.default;
let formattedFees = formatFeeTypes(rawFees);


/*
  Exportable Functions
*/

/**
 * Maps each order to its associated fee
 * 
 * @param {Array} 
 * @return {Object}
 */
export function createOrdersFees(orderArray) {
  return orderArray.map( order => {
    let orderCalculations = calculaterOrderItems(order.order_items);
    return {
      id: order.order_number,
      order_items: orderCalculations.order_items, // an array of items with their type and fee price
      total_fees: orderCalculations.total_fees,
      additionalPriceAmount: orderCalculations.additionalPriceAmount
    }
  })
}

/**
 * Maps each order to its associated fee distributions
 *
 * @param {Array} 
 * @return {Object}
 */
export function createOrderDistributions(orderArray) {
  let ordersWithCalculatedFees = createOrdersFees(orderArray);
  let result = {}

  result.orders = ordersWithCalculatedFees.map( order => {
    let items = order.order_items;
    let totalFees = order.total_fees;
    let additionalFees = order.additionalPriceAmount;
    let distributionCalculations = calculatFundDistributions(items, totalFees, additionalFees);

    return {
      id: order.id,
      distributions: distributionCalculations.distributions,
    }
  })

  result.total_distributions = calculateDistTotal(result.orders);

  return result
}

/**
 * Prepares order and fee associations to be displayed
 */
export function moldFeeResults() {
  let formattedOrdersFees = createOrdersFees(orders);
  console.log(prepareOrdersFeeString(formattedOrdersFees))
}

/**
 * Prepares order and fee distribution associations to be displayed
 */
export function moldFundResults() {
  let formattedFunds = createOrderDistributions(orders);
  console.log(prepareOrdersFundString(formattedFunds));
}


/*
  Object Formating Helper Functions
*/

/**
 * Maps an array of fees into an object 
 *
 * @param {Array} 
 * @return {Object}
 */
function formatFees(possibleFees) {
  let result = {};
  possibleFees.forEach(fee => {
    result[fee.type] = fee.amount;
  })

  return result;
}

/**
 * Maps an array of fees type into an object 
 *
 * @param {Array} 
 * @return {Object}
 */
function formatFeeTypes(rawFees) {
  let result = {}
  rawFees.forEach(feeType => {
    result[feeType.order_item_type] = {}
    result[feeType.order_item_type].fees = formatFees(feeType.fees);
    result[feeType.order_item_type].distributions = formatDistributions(feeType.distributions, feeType.fees);
  })

  return result;
}

/**
 * Generates a percentage association between each fund and the fund total
 * 
 * @param {Array} 
 * @param {Array} 
 * @return {Array}
 */

function formatDistributions(distributions, fees) {
  let realFee = fees.reduce((fee1, fee2) => {
    return {amount: Math.max(parseFloat(fee1.amount), parseFloat(fee2.amount))};
  }, {amount: 0}).amount;

  return distributions.map(dist => {
    return {
      name: dist.name,
      percentage: (dist.amount / realFee),
    }
  })
}

/**
 * Generate fund distribution for each order item
 *
 * @param {Array} 
 * @param {Number} 
 * @param {Number} 
 * @return {Object}
 */

function calculatFundDistributions(orderItems, totalFee, addFee) {
  let distributionPerItem = orderItems.map(order => {
    return calculateDistritionPerItem(order, totalFee, addFee);
  })
  let reconciledDist = reconcileDistributions(distributionPerItem);

  return {
    distributions: reconciledDist,
  }
}

/**
 * Generate total and additional fee for each order item
 *
 * @param {Array} 
 * @return {Object}
 */
function calculaterOrderItems(orderItems) { 
  let feesPerItem = orderItems.map(item => {
    return calculateFeePerItem(item);
  })
  let total = calculateTotal(feesPerItem).price;
  let additionalTotal = calculateTotalAdditional(feesPerItem).additionalPriceAmount;

  return {
    order_items: feesPerItem,
    total_fees: total,
    additionalPriceAmount: additionalTotal
  }
}


/*
  Calculation Helper Functions
*/

/**
 * Calculates total fee associated with an order
 *
 * @param {Array} 
 * @return {Array}
 */
function calculateTotal(items) { 
  return items.reduce((item1, item2) => {
    return {price: parseFloat(item1.price) + parseFloat(item2.price)}
  }, {price: 0})
};

/**
 * Generate total distribution for each an order
 *
 * @param {Array} 
 * @return {Object}
 */
function calculateDistTotal(orders) {

  let result = orders.map(order => {
    return order.distributions;
  });

  return reconcileDistributions(result);
}

/**
 * Calculates additional fees associated with an order
 *
 * @param {Array} 
 * @return {Array}
 */
function calculateTotalAdditional(items) {
  return items.reduce((item1, item2) => {
    return {additionalPriceAmount: parseFloat(item1.additionalPriceAmount) + parseFloat(item2.additionalPriceAmount)}
  }, {additionalPriceAmount: 0})
}

/**
 * Calculates fund distribution for an order item
 *
 * @param {Array} 
 * @return {Array}
 */
function calculateDistritionPerItem(order) {
  let distResults = [];
  let distPercentages;
  let orderFee = order.price;
  let additionalFee = order.additionalPriceAmount;
  
  // calculate distribution per fund
  if(order.type === "Real Property Recording") {
    distPercentages = formattedFees["Real Property Recording"].distributions

    // subtract the additional amount in order to get accurant percentages
    if(additionalFee) {
      orderFee -= additionalFee
    }

    distPercentages.forEach(dist => {
      distResults.push({
        name: dist.name,
        amount: parseFloat((orderFee * dist.percentage).toFixed(2))
      })
    })

  } else if (order.type === "Birth Certificate") {
    distPercentages = formattedFees["Birth Certificate"].distributions
    distPercentages.forEach(dist => {
      distResults.push({
        name: dist.name,
        amount: parseFloat((orderFee * dist.percentage).toFixed(2))
      })
    })
  }


  if (additionalFee) {
    distResults.push({
      name: "Other",
      amount: additionalFee,
    })
  }

  return distResults;
}

/**
 * Calculates total fees associated with an order
 *
 * @param {Array} 
 * @return {Object}
 */
function calculateFeePerItem(item) {
  let itemResults = {
    type: item.type,
    additionalPriceAmount: 0
  };

  if(item.type === "Real Property Recording") {
    let firstPageFee = formattedFees["Real Property Recording"].fees.flat;

    if(item.pages > 1) {
      let additionalPages = item.pages - 1;
      let additionalPagesFee = formattedFees["Real Property Recording"].fees["per-page"];
      let additionalPriceAmount = parseFloat(additionalPages * additionalPagesFee);
      let totalItemFee = parseFloat(firstPageFee) + parseFloat(additionalPages * additionalPagesFee);
      itemResults.price = totalItemFee;
      itemResults.additionalPriceAmount = additionalPriceAmount;
    } else {
      itemResults.price = parseFloat(firstPageFee)
    }

  } else if(item.type === "Birth Certificate") {
    let birthCertificateFee = formattedFees["Birth Certificate"].fees.flat;
    itemResults.price = parseFloat(birthCertificateFee);
  }

  return itemResults;
}


/*
  Ultra Utility Functions
*/

/**
 * Reconcile multiple fund distributions of any given order
 *
 * @param {Array} 
 * @return {Array}
 */
function reconcileDistributions(orderDistributions) {
  let flattenedDist = orderDistributions.reduce((dist1, dist2) => {
    // using es6  spread operator to flatten our (2x2) matrix distributions array
    return [...dist1, ...dist2];
  });

  let reducedDist = flattenedDist.reduce((totalDist, individualDist) => {
    if(individualDist.name in totalDist) {
      totalDist[individualDist.name] += individualDist.amount;
    } else {
      totalDist[individualDist.name] = individualDist.amount;
    }
    return totalDist;
  }, {})

  let result = [];

  for(let item in reducedDist) {
    result.push({name: item, amount: reducedDist[item]});
  }

  return result
}


/*
  Formatting Output String Helper Functions
*/

/**
 * Prepares order and fee associations for display
 *
 * @param {Array} 
 * @return {String}
 */
function prepareOrdersFeeString(orders) {
  let resultString = '';

  orders.forEach(order => {
    resultString += `Order ID: ${order.id}\n`;
    resultString += prepareOrderItemString(order.order_items, resultString);
    resultString += `    Order total: ${order.total_fees}\n`;
  })

  return resultString;
}

/**
 * Prepares order items for display
 *
 * @param {Array} 
 * @param {String} 
 * @return {String}
 */
function prepareOrderItemString(items, string) {
  let resultString = ``;

  items.forEach(item => {
    resultString += `    Order item - ${item.type}: ${item.price}\n`;
  })

  return resultString;
}

/**
 * Prepares order distributions for display
 *
 * @param {Array} 
 * @param {String} 
 * @return {String}
 */
function prepareOrderDistString(dist, string) {
  let resultString = ``;
  dist.forEach(item => {
    resultString += `    Fund - ${item.name}: ${item.amount}\n`;
  })

  return resultString;
}


/**
 * Prepares order and fee distribution associations for display
 *
 * @param {Array} 
 * @return {String}
 */
function prepareOrdersFundString(result) {
  let resultString = ``;

  result.orders.forEach(order => {
    resultString += `Order ID: ${order.id}\n`;
    resultString += prepareOrderDistString(order.distributions, resultString);
  })

  resultString += `Total distributions:\n`;
  resultString += prepareOrderDistString(result.total_distributions, resultString);

  return resultString;
}
