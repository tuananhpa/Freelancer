import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/".local"/"python-deps"))
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
 c=b.new_context(service_workers="allow");page=c.new_page()
 page.on("console",lambda msg:print(msg.type+": "+msg.text,flush=True))
 page.on("requestfailed",lambda req:print("FAILED "+req.url+" "+str(req.failure),flush=True))
 page.goto("http://127.0.0.1:4177/pos");page.wait_for_load_state("networkidle")
 print(page.evaluate("async()=>{try {const r=await navigator.serviceWorker.register('/sw.js'); return {success:true,scope:r.scope}}catch(e){return {error:String(e)}}}"),flush=True)
 page.wait_for_timeout(2000)
 b.close()
