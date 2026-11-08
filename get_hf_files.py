import os
import urllib.request
import json

def get_hf_files(repo_id):
    api_url = f"https://huggingface.co/api/models/{repo_id}/tree/main"
    req = urllib.request.Request(api_url)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print("Error:", e)
        return []

files = get_hf_files("michl1149/anonymous-female-singer")
print(files)
