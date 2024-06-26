import { WechatyBuilder, Wechaty, Contact } from "wechaty";
import QRCode from "qrcode";
import { ChatGPTBot } from "./bot";
import { config } from "./config";

const chatGPTBot = new ChatGPTBot();

const bot: Wechaty = WechatyBuilder.build({
  name: "wechat-assistant", // generate xxxx.memory-card.json and save login data for the next login
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true,
  },
});

async function main() {
  const initializedAt = Date.now();
  
  bot.on("scan", async (qrcode: string, status: string) => {
    const url = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
    console.log(`Scan QR Code to login: ${status}\n${url}`);
    console.log(await QRCode.toString(qrcode, { type: "terminal", small: true }));
  });

  bot.on("login", async (user: Contact) => {
    chatGPTBot.setBotName(user.name());
    console.log(`User ${user.name()} logged in`);
    console.log(`私聊触发关键词: ${config.chatPrivateTriggerKeyword}`);
    console.log(`已设置 ${config.blockWords.length} 个聊天关键词屏蔽. ${config.blockWords}`);
    console.log(`已设置 ${config.chatgptBlockWords.length} 个ChatGPT回复关键词屏蔽. ${config.chatgptBlockWords}`);
  });

  bot.on("message", async (message: any) => {
    if (message.date().getTime() < initializedAt) {
      return;
    }

    if (message.text().startsWith("/ping")) {
      await message.say("pong");
      return;
    }

    try {
      await chatGPTBot.onMessage(message);
    } catch (e) {
      console.error(e);
    }
  });

  try {
    await bot.start();
  } catch (e) {
    console.error(`⚠️ Bot start failed, can you log in through wechat on the web?: ${e}`);
  }
}

main();
