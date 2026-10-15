import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/".local"/"python-deps"))
from playwright.sync_api import sync_playwright,expect
base=sys.argv[1].rstrip("/")
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    context=browser.new_context(viewport={"width":1440,"height":1000},service_workers="allow")
    page=context.new_page();errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    for route in ["/pos","/admin/dashboard","/admin/products","/tables"]:
        print("CHECK "+route,flush=True)
        response=page.goto(base+route,timeout=20000)
        page.wait_for_load_state("networkidle")
        assert response.status==200,(route,response.status)
        assert page.locator("#app").inner_text().strip()
    page.goto(base+"/pos");page.wait_for_load_state("networkidle")
    ready=page.evaluate("()=>Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))])")
    assert ready,page.evaluate("async()=>({secure:isSecureContext,registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.state,installing:r.installing?.state})),errors:[]})")
    page.reload();page.wait_for_load_state("networkidle")
    context.set_offline(True)
    page.reload();page.wait_for_load_state("domcontentloaded")
    expect(page.get_by_role("heading",name="Bán hàng",exact=True)).to_be_visible()
    expect(page.locator(".offline")).to_be_visible()
    expect(page.get_by_text("Cà phê sữa",exact=True).first).to_be_visible()
    context.set_offline(False)
    assert not errors,errors
    result={"url":base,"routes":4,"pwaOfflineShell":True,"javascriptErrors":errors,"health":context.request.get(base+"/_health").status}
    (root/"docs"/"screenshots"/"tunnel-results.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result))
    browser.close()
