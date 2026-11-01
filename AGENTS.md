# Škola hrou – pokyny pro další úpravy

Před přidáním učiva přečtěte `docs/CONTENT_GUIDE.md` a README. Každé téma má konkrétní ročník a předmět. Existující učivo patří do 2. třídy; ostatní ročníky neplnit bez zadání. Zachovat stabilní ID témat, profily a starou historii. Nové typy úloh musí mít online ovládání, kontrolu odpovědi a vhodný převod do PDF/Wordu/tisku. U změn šablony zkontrolovat skutečné vykreslení dokumentů. Podklady ve `1/` a výstupy v `preview/` jsou místní a nepublikují se. Ověření: `npm test` a `npm run build`.

Při rozšíření dodržovat kvóty a metodiku rozmanitosti v `docs/CONTENT_GUIDE.md`: 100 pevných zadání na jazykový okruh, 100 vět pro každý druh věty zvlášť, 25 odlišných příběhových šablon. Audit bank je v `tests/content-banks.test.ts`. QR upload a AI kontrola rukopisu jsou zatím pouze posouzené v `docs/HANDWRITING_FEASIBILITY.md`, bez implementace a bez cloudového ukládání.
