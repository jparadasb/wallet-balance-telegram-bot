const BudaPromise = require('buda-promise');
const TelegramBot = require('node-telegram-bot-api');
const numeral = require("numeral");
const http = require("http");

const { BUDA_API_KEY, BUDA_SECRET, AUTHORIZED_IDS, TELEGRAM_BOT_TOKEN } = process.env;

const Buda = new BudaPromise(BUDA_API_KEY, BUDA_SECRET);

const Bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });



const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

Bot.onText(/\/start/, (msg) => {
  if (AUTHORIZED_IDS.split(",").includes(msg.chat.id.toString())) {
    Bot.sendMessage(msg.chat.id, `Hola ${msg.chat.first_name}, soy C3PO y te voy a ayudar a cuidar tus ahorros`, {
      reply_markup: {
        keyboard: [["Balance en BTC", "Balance en CLP"]],
      },
    });
  }
});

Bot.onText(/Balance en BTC/, (msg) => {
  if (AUTHORIZED_IDS.split(",").includes(msg.chat.id.toString())) {
    Promise.all([Buda.balance("BTC"), Buda.ticker("BTC-CLP")])
      .then(
        ([
          {
            balance: {
              amount: [currentBalance, origin_currency]
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
            `<b>Tu balance en ${origin_currency}:</b> ${currentBalance}`,
            { parse_mode: "HTML" }
          );
        }
      )
      .catch((err) => console.log(err));


  }
});

Bot.onText(/Balance en CLP/, (msg) => {
  if (AUTHORIZED_IDS.split(",").includes(msg.chat.id.toString())) {
    Promise.all([Buda.balance("BTC"), Buda.ticker("BTC-CLP")])
      .then(
        ([
          {
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
            `<b>Tu balance en ${destiny_currency}:</b> $${
              numeral(currentBalance * last_price, 2).format('0,0')
            }\n
            `,
            { parse_mode: "HTML" }
          );
        }
      )
      .catch((err) => console.log(err));
  }
});