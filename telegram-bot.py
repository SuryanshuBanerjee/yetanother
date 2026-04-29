#!/usr/bin/env python3
"""
Telegram Bot for Trend Analysis
Uses Featherless AI directly for analysis
"""

import asyncio
import os
import json
import httpx
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(".env.local")

# Configuration
BOT_TOKEN = "8093946168:AAFev1AgFXppKad9JQZc5DcWDVlZ7bIR5wA"
FEATHERLESS_API_KEY = os.environ.get("FEATHERLESS_API_KEY", "")
FEATHERLESS_URL = "https://api.featherless.ai/v1/chat/completions"
FEATHERLESS_MODEL = "moonshotai/Kimi-K2.5"


async def analyze_with_featherless(keyword: str) -> dict:
    """Call Featherless AI directly for trend analysis."""
    if not FEATHERLESS_API_KEY:
        raise ValueError("FEATHERLESS_API_KEY environment variable not set")
    
    system_prompt = """You are a trend analyst. Analyze the given trend keyword and provide a structured analysis.
Return your analysis as JSON with this exact structure:
{
    "keyword": "the keyword",
    "phase": "Growth/Peak/Saturation/Decay/Revival",
    "healthScore": 0-100,
    "verdict": "BUY/HOLD/WATCH",
    "confidence": 0-100,
    "summary": "2-3 sentence summary",
    "riskLevel": "Low/Medium/High/Critical",
    "timeHorizon": "estimated duration like '1-2 weeks'",
    "pros": ["pro1", "pro2", "pro3"],
    "cons": ["con1", "con2", "con3"],
    "actionItems": ["action1", "action2", "action3"]
}"""

    user_prompt = f"Analyze this trend: {keyword}"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            FEATHERLESS_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
            },
            json={
                "model": FEATHERLESS_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)


def format_analysis_message(data: dict) -> str:
    """Format the Featherless response into a user-friendly Telegram message."""
    keyword = data.get("keyword", "Unknown")
    health_score = data.get("healthScore", 50)
    phase = data.get("phase", "Unknown")
    verdict = data.get("verdict", "HOLD")
    confidence = data.get("confidence", 50)
    summary = data.get("summary", "")
    risk_level = data.get("riskLevel", "Medium")
    time_horizon = data.get("timeHorizon", "Unknown")
    pros = data.get("pros", [])
    cons = data.get("cons", [])
    action_items = data.get("actionItems", [])
    
    # Phase emoji
    phase_emoji = {
        "Growth": "📈", "Peak": "🔝", "Saturation": "🎯",
        "Decay": "📉", "Revival": "🔄", "Zombie": "🧟"
    }.get(phase, "❓")
    
    # Verdict emoji
    verdict_emoji = {"BUY": "🟢", "HOLD": "🟡", "WATCH": "🔴"}.get(verdict, "⚪")
    
    lines = [
        f"🔍 *Trend Analysis: {keyword}*",
        "",
        f"{phase_emoji} *Phase:* {phase}",
        f"💚 *Health Score:* {health_score}/100",
        f"{verdict_emoji} *Verdict: {verdict}* ({confidence}% confidence)",
        f"🎯 *Risk Level:* {risk_level}",
        f"⏰ *Time Horizon:* {time_horizon}",
    ]
    
    if summary:
        lines.extend(["", f"📝 _{summary}_"])
    
    if pros:
        lines.extend(["", "✅ *Pros:*"])
        for p in pros[:3]:
            lines.append(f"  • {p}")
    
    if cons:
        lines.extend(["", "❌ *Cons:*"])
        for c in cons[:3]:
            lines.append(f"  • {c}")
    
    if action_items:
        lines.extend(["", "📋 *Action Items:*"])
        for i, item in enumerate(action_items[:3], 1):
            lines.append(f"  {i}. {item}")
    
    lines.extend(["", "🤖 _Powered by Featherless AI_"])
    
    return "\n".join(lines)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command."""
    print(f"📩 Received /start from {update.effective_user.first_name}")
    welcome_message = """
🎯 *TREND PRISM Bot*

I analyze trends using Featherless AI!

*How to use:*
• Send `/analyze <keyword>` to analyze a trend
• Or just send a keyword directly

*Example:*
`/analyze Taylor Swift`
`Bitcoin`
`AI startups`

Let's decode some trends! 🚀
"""
    await update.message.reply_text(welcome_message, parse_mode="Markdown")


async def analyze_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /analyze command."""
    print(f"📩 Received /analyze command")
    if not context.args:
        await update.message.reply_text(
            "Please provide a keyword to analyze.\n\nExample: `/analyze Taylor Swift`",
            parse_mode="Markdown"
        )
        return
    
    keyword = " ".join(context.args)
    await process_keyword(update, keyword)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle direct text messages as keywords."""
    keyword = update.message.text.strip()
    print(f"📩 Received message: {keyword}")
    if keyword:
        await process_keyword(update, keyword)


async def process_keyword(update: Update, keyword: str) -> None:
    """Process a keyword and return analysis."""
    print(f"🔄 Processing keyword: {keyword}")
    status_message = await update.message.reply_text(
        f"🔍 Analyzing *{keyword}* with Featherless AI... This may take 10-30 seconds.",
        parse_mode="Markdown"
    )
    
    try:
        data = await analyze_with_featherless(keyword)
        message = format_analysis_message(data)
        await status_message.edit_text(message, parse_mode="Markdown")
        
    except ValueError as e:
        await status_message.edit_text(
            f"❌ *Configuration Error*\n\n{str(e)}\n\nSet the FEATHERLESS_API_KEY environment variable.",
            parse_mode="Markdown"
        )
    except httpx.TimeoutException:
        await status_message.edit_text(
            "⏱️ *Timeout*\n\nThe analysis is taking too long. Please try again.",
            parse_mode="Markdown"
        )
    except json.JSONDecodeError:
        await status_message.edit_text(
            "❌ *Error*\n\nFailed to parse AI response. Please try again.",
            parse_mode="Markdown"
        )
    except Exception as e:
        await status_message.edit_text(
            f"❌ *Error*\n\nSomething went wrong: {str(e)[:200]}",
            parse_mode="Markdown"
        )



# Configure logging
import logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

def main() -> None:
    """Start the Telegram bot."""
    print("🤖 Starting Trend Prism Telegram Bot (Featherless AI)...")
    
    if not FEATHERLESS_API_KEY:
        print("⚠️  WARNING: FEATHERLESS_API_KEY not set!")
        print("   Set it with: export FEATHERLESS_API_KEY=your_key")
        # Or continue if loaded from .env.local
    else:
        print(f"✅ Featherless API key configured")
    
    
    # Configure application with timeouts
    # Simplified config - rely on defaults first, adding only necessary timeouts
    from telegram.request import HTTPXRequest
    request = HTTPXRequest(connection_pool_size=8, connect_timeout=30.0, read_timeout=30.0, write_timeout=30.0)
    
    application = Application.builder().token(BOT_TOKEN).request(request).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("analyze", analyze_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    

    print("✅ Bot is running! Press Ctrl+C to stop.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
