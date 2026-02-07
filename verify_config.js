const fs = require('fs');
const path = require('path');

async function verify() {
    console.log("Verifying Backend Configuration...");

    try {
        const filePath = path.join(__dirname, 'src', 'lib', 'llm-clients.ts');
        console.log(`Checking file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error("❌ File not found!");
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('arcee-ai/trinity-mini:free')) {
            console.log("✅ OpenRouter model 'arcee-ai/trinity-mini:free' found in code.");
        } else {
            console.error("❌ OpenRouter model NOT found!");
        }

        if (content.includes('Qwen/Qwen2.5-7B-Instruct')) {
            console.log("✅ Featherless model 'Qwen/Qwen2.5-7B-Instruct' found in code.");
        } else {
            console.error("❌ Featherless model 'Qwen/Qwen2.5-7B-Instruct' NOT found!");
        }

        // Check env file for key update (partial check for security)
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('rc_4b14e8d6ed9b7dcc4e3eefc2be109c3e72a320e9f22cf0492bc359e008b2eb66')) {
                console.log("✅ .env.local updated with new Featherless key.");
            } else {
                console.error("❌ .env.local does NOT contain the new Featherless key!");
            }
        } else {
            console.error("❌ .env.local not found!");
        }

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verify();
