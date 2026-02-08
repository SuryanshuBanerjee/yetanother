import os
import sys

# Install google-genai if not present (optional helper, but better to rely on pip install)
try:
    from google import genai
except ImportError:
    print("Please run: pip install -U google-genai")
    sys.exit(1)

# Set the API key provided
os.environ["GEMINI_API_KEY"] = "AIzaSyBaQ01R_ipcbpO5KPGAf_H5FIn4OsmsYUE"

def test_key():
    print("Initializing Google GenAI Client...")
    try:
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        
        print("Sending request to Gemini model...")
        # Using gemini-2.0-flash as it is the current standard efficient model. 
        # If 2.5 was intended and exists, it can be swapped, but 2.0-flash is safer for verification.
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents="Explain how the Google AI Studio API works in a few words."
        )
        
        print("\n✅ API Key Works! Response:")
        print("-" * 30)
        print(response.text)
        print("-" * 30)
        
    except Exception as e:
        print(f"\n❌ Error validating API key: {e}")

if __name__ == "__main__":
    test_key()
