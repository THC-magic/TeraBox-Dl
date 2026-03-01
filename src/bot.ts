import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN!);
const API_BASE = process.env.API_BASE!;

const fileCache = new Map<string, any>();

// ================= START =================
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🚀 Send any TeraBox link (single file or folder). I support all domains."
  );
});

// ================= LINK NORMALIZER =================
function normalizeLink(text: string): string | null {
  try {
    const url = new URL(text.trim());
    if (!url.pathname.includes("/s/") && !url.searchParams.has("surl"))
      return null;

    const surl =
      url.searchParams.get("surl") ||
      url.pathname.split("/s/")[1]?.split("/")[0];

    if (!surl) return null;

    return `https://terabox.com/s/${surl}`;
  } catch {
    return null;
  }
}

// ================= MAIN HANDLER =================
bot.on("message:text", async (ctx) => {
  const normalized = normalizeLink(ctx.message.text);

  if (!normalized) {
    return ctx.reply("❌ Invalid TeraBox link.");
  }

  await ctx.reply("🔍 Fetching file list...");

  try {
    const res = await fetch(
      `${API_BASE}/api?url=${encodeURIComponent(normalized)}`
    );
    const data = await res.json();

    if (data.status !== "success") {
      return ctx.reply("❌ Extraction failed.");
    }

    if (!data.list || data.list.length === 0) {
      return ctx.reply("❌ No files found.");
    }

    // Save in cache
    fileCache.set(ctx.chat.id.toString(), data.list);

    const keyboard = new InlineKeyboard();

    data.list.forEach((file: any, index: number) => {
      keyboard.text(
        `${file.server_filename} (${file.size})`,
        `file_${index}`
      ).row();
    });

    await ctx.reply("📂 Select a file:", {
      reply_markup: keyboard,
    });

  } catch (err) {
    console.error(err);
    await ctx.reply("⚠ Server error.");
  }
});

// ================= FILE SELECT HANDLER =================
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (!data.startsWith("file_")) return;

  const index = parseInt(data.split("_")[1]);

  const files = fileCache.get(ctx.chat.id.toString());

  if (!files || !files[index]) {
    return ctx.answerCallbackQuery({ text: "Expired. Send link again." });
  }

  const file = files[index];

  const keyboard = new InlineKeyboard();

  if (file.dlink) {
    keyboard.url("⬇ Direct Download", file.dlink);
  }

  keyboard.url(
    "🔗 Open in Browser",
    `https://terabox.com/s/${file.surl || ""}`
  );

  await ctx.reply(
    `📂 <b>${file.server_filename}</b>\n📦 ${file.size}`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );

  await ctx.answerCallbackQuery();
});

bot.start();
console.log("🔥 Multi-File Bot Running...");
