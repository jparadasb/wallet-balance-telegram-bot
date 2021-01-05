const request = require("request");
const crypto = require("crypto");

const singRequest = ({
  method = "GET",
  body = "",
  apiKey,
  secretKey,
  requestPath
}) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = timestamp + method + "/v2/" + requestPath + body;
  const headers = [
    {
      "Content-Type": "application/json",
    },
    {
      "CB-ACCESS-KEY": apiKey,
    },
    {
      "CB-ACCESS-TIMESTAMP": timestamp,
    },
    {
      "CB-VERSION": "2016-02-18",
    },
  ];


  const cbAccessSign = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");


  const options = {
    url: "https://api.coinbase.com/v2/" + requestPath,
    method: method,
    headers: headers
      .concat([
        {
          "CB-ACCESS-SIGN": cbAccessSign,
        },
      ])
      .reduce((prev, newV) => ({
        ...prev,
        ...newV,
      })),
  };

  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        return resolve(JSON.parse(body));
      }

      if (response.statusCode > 400 && response.statusCode < 500) {
        return reject(JSON.parse(body))
      }

      return reject(err)
    });
  })
}

const coinbaseApi = (apiKey, secretKey) => {
  const requester = {
    post: ({ requestPath, body }) =>
      singRequest({
        apiKey,
        secretKey,
        method: "POST",
        body,
        requestPath,
      }),
    get: ({ requestPath }) =>
      singRequest({
        apiKey,
        secretKey,
        method: "GET",
        requestPath,
      }),
  };

  return {
    ...requester,
    accounts: () => requester.get({requestPath: "accounts"}),
    account: (accountId) => requester.get({requestPath: `accounts/${accountId}`})
  };
}


module.exports = {
  CoinbaseInit: coinbaseApi,
};