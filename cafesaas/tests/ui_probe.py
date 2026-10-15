import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/".local"/"python-deps"))
from playwright.sync_api import sync_playwright
out=root/"docs"/"screenshots"
out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    context=browser.new_context(viewport={"width":1440,"height":1000},service_workers="block")
    page=context.new_page()
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto("http://127.0.0.1:4177/pos")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(out/"pos-desktop.png"),full_page=True)
    print(json.dumps({"text":page.inner_text("body")[:1500],"buttons":page.get_by_role("button").all_text_contents(),"errors":errors,"overflow":page.evaluate("document.documentElement.scrollWidth>innerWidth")},ensure_ascii=False))
    page.goto("http://127.0.0.1:4177/admin/dashboard")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(out/"admin-desktop.png"),full_page=True)
    print(json.dumps({"dashboard":page.inner_text("body")[-1500:],"errors":errors},ensure_ascii=False))
    browser.close()
