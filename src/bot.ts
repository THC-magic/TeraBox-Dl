import { Bot } from "grammy";
import { tera } from "./lib/terabox";
import { isValidShareUrl, extractSurl, formatBytes } from "./lib/utils";

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command("start", async (ctx) => {
  await ctx.reply("Send me a TeraBox share link.");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (!isValidShareUrl(text)) {
    return ctx.reply("Please send a valid TeraBox share link.");
  }

  await ctx.reply("🔍 Extracting...");

  try {
    const surl = extractSurl(text);

    if (!surl) {
      return ctx.reply("Failed to extract surl from URL.");
    }

    const data = await tera(surl);

    if (!data || data.error) {
      return ctx.reply("❌ Extraction failed.\n" + (data?.error || ""));
    }

    if (data.list && data.list.length > 0) {
      const file = data.list[0];

      const filename = file.server_filename;
      const size = formatBytes(file.size);
      const download = file.dlink;

      await ctx.reply(
        `📂 ${filename}\n📦 ${size}\n\n⬇ ${download}`
      );

    } else {
      await ctx.reply("No files found in this link.");
    }

  } catch (err: any) {
    console.error(err);
    await ctx.reply("⚠ Internal error occurred.");
  }
});

bot.start();
console.log("🤖 Telegram Bot Started...");
