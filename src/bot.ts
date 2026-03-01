import { Bot } from "grammy";
import { tera } from "./lib/terabox";
import { extractSurl, isValidShareUrl, formatBytes } from "./lib/utils";

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command("start", async (ctx) => {
  await ctx.reply("Send me a TeraBox share link.");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (!isValidShareUrl(text)) {
    return ctx.reply("❌ Please send a valid TeraBox share link.");
  }

  await ctx.reply("🔍 Extracting...");

  try {
    const surl = extractSurl(text);
    const data = await tera(surl!);

    if (!data?.list?.length) {
      return ctx.reply("No files found.");
    }

    const file = data.list[0];

    await ctx.reply(
      `📂 ${file.server_filename}\n📦 ${formatBytes(file.size)}\n\n⬇ ${file.dlink}`
    );

  } catch (err) {
    console.error(err);
    await ctx.reply("⚠ Extraction failed.");
  }
});

bot.start();
console.log("🤖 Telegram Bot Running...");
