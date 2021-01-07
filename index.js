const BudaPromise = require('buda-promise');
const TelegramBot = require('node-telegram-bot-api');
const numeral = require("numeral");
const http = require("http");

const {
  CoinbaseInit
} = require("./coinbase");



const {
  BUDA_API_KEY,
  BUDA_SECRET,
  COINBASE_API_KEY,
  COINBASE_SECRET,
  COINBASE_BTC_WALLET,
  AUTHORIZED_IDS,
  TELEGRAM_BOT_TOKEN,
  ADMIN_TELEGRAM_ID,
  COINBASE_XLM_WALLET,
} = process.env;

const coinbaseClient = CoinbaseInit(COINBASE_API_KEY, COINBASE_SECRET)

const Buda = new BudaPromise(BUDA_API_KEY, BUDA_SECRET);

const Bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: true
});



const hostname = "127.0.0.1";
const port = 3000;

const COMMANDS = {
  BUDA_BTC: "BTC BUDA",
  BUDA_CLP: "CLP BUDA",
  COINBASE: "COINBASE BTC",
  COINBASE_BALANCE_BTC: "Balance en BTC",
  COINBASE_BALANCE_CLP: "Balance en CLP",
  COINBASE_XLM: "COINBASE LUMENS"
};
const REGEXP = Object.keys(COMMANDS).reduce((regexp, key) => ({
  ...regexp,
  [key]: new RegExp(COMMANDS[key])
}), {})

const isAdmin = (id) => (id === ADMIN_TELEGRAM_ID);

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const getAdminActions = (userId) => {
  if (ADMIN_TELEGRAM_ID === userId) {
    return [
      [COMMANDS.BUDA_BTC],
      [COMMANDS.BUDA_CLP],
      [COMMANDS.COINBASE],
      [COMMANDS.COINBASE_XLM],
    ];
  }

  return []
}

Bot.onText(/\/start/, (msg) => {
  const keyboards = [
    [COMMANDS.COINBASE_BALANCE_BTC],
    [COMMANDS.COINBASE_BALANCE_CLP],
  ];
  const currentChatId = msg.chat.id.toString();
  if (AUTHORIZED_IDS.split(",").includes(currentChatId)) {
    return Bot.sendMessage(
      msg.chat.id,
      `Hola ${msg.chat.first_name}, soy C3PO y te voy a ayudar a cuidar tus ahorros`, {
        reply_markup: {
          keyboard: [...keyboards, ...getAdminActions(currentChatId)],
        },
      }
    );
  }
});

Bot.onText(REGEXP.COINBASE_BALANCE_BTC, (msg) => {
  if (AUTHORIZED_IDS.split(",").includes(msg.chat.id.toString())) {
    coinbaseClient
      .account(COINBASE_BTC_WALLET)
      .then(({
        data: {
          currency,
          balance
        }
      }) => {
        Bot.sendMessage(
          msg.chat.id,
          `<b>Tu balance en ${currency}:</b> ${balance.amount}`, {
            parse_mode: "HTML",
          }
        );
      })
      .catch((err) => console.log(err));
  }
})

Bot.onText(REGEXP.COINBASE_BALANCE_CLP, (msg) => {
  if (AUTHORIZED_IDS.split(",").includes(msg.chat.id.toString())) {
    coinbaseClient
      .account(COINBASE_BTC_WALLET)
      .then(({
        data: {
          native_balance
        }
      }) => {
        Bot.sendMessage(
          msg.chat.id,
          `<b>Tu balance en ${native_balance.currency}:</b> ${numeral(
            native_balance.amount
          ).format("0,0")}`, {
            parse_mode: "HTML",
          }
        );
      })
      .catch((err) => console.log(err));
  }
});

Bot.onText(REGEXP.COINBASE, (msg) => {
  if (AUTHORIZED_IDS.split(",").includes(msg.chat.id.toString())) {
    coinbaseClient
      .account(COINBASE_BTC_WALLET)
      .then(({
        data: {
          balance,
          native_balance
        }
      }) => {
        Bot.sendMessage(
          msg.chat.id,
          `<b>Tu balance en ${balance.currency}:</b> ${balance.amount} \n` +
          `<b>Tu balance en ${native_balance.currency}:</b> ${numeral(
            native_balance.amount
          ).format("0,0")}`, {
            parse_mode: "HTML",
          }
        );
      })
      .catch((err) => console.log(err));
  }
});

Bot.onText(REGEXP.BUDA_BTC, (msg) => {
  if (isAdmin(msg.chat.id.toString())) {
    Promise.all([Buda.balance("BTC"), Buda.ticker("BTC-CLP")])
      .then(
        ([{
            balance: {
              amount: [currentBalance, origin_currency],
            },
          },
          {
            ticker: {
              last_price: [last_price, destiny_currency],
            },
          },
        ]) => {
          Bot.sendMessage(
            msg.chat.id,
            `<b>Tu balance en ${origin_currency}:</b> ${currentBalance}`, {
              parse_mode: "HTML",
            }
          );
        }
      )
      .catch((err) => console.log(err));
  }
});

Bot.onText(REGEXP.BUDA_CLP, (msg) => {
  if (isAdmin(msg.chat.id.toString())) {
    Promise.all([Buda.balance("BTC"), Buda.ticker("BTC-CLP")])
      .then(
        ([{
            balance: {
              amount: [currentBalance, origin_currency],
            },
          },
          {
            ticker: {
              last_price: [last_price, destiny_currency],
            },
          },
        ]) => {
          console.log(`${new Date().toISOString()} request: ${msg.chat.id} `);
          Bot.sendMessage(
            msg.chat.id,
            `<b>Tu balance en ${destiny_currency}:</b> $${numeral(
              currentBalance * last_price,
              2
            ).format("0,0")}\n
            `, {
              parse_mode: "HTML",
            }
          );
        }
      )
      .catch((err) => console.log(err));
      
  }
});

Bot.onText(REGEXP.COINBASE_XLM, (msg) => {
  if (isAdmin(msg.chat.id.toString())) {
    coinbaseClient
      .account(COINBASE_XLM_WALLET)
      .then(({ data: { balance, native_balance } }) => {
        Bot.sendMessage(
          msg.chat.id,
          `<b>Tu balance en ${balance.currency}:</b> ${balance.amount} \n` +
            `<b>Tu balance en ${native_balance.currency}:</b> ${numeral(
              native_balance.amount
            ).format("0,0")}`,
          {
            parse_mode: "HTML",
          }
        );
      })
      .catch((err) => console.log(err));
  }
});