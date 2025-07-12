Případová studie: Automatizace generování platebních QR kódů
Problém:
Klient potřeboval zefektivnit platební proces na svých prodejních místech (POS). Bylo nutné vytvořit systém, který automaticky vygeneruje platební QR kód pro poslední vytvořenou objednávku, aby jej obsluha mohla okamžitě prezentovat zákazníkovi.

Moje řešení:
Vytvořil jsem automatizační skript v prostředí Google Apps Script, který slouží jako prostředník mezi Shopify a platební bránou. Skript se v pravidelných intervalech bezpečně připojuje k Shopify REST API, pomocí specifických filtrů (stav, lokace, zdroj) identifikuje nejnovější relevantní objednávku a získá její data. Následně tato data použije k dynamickému sestavení požadavku na externí Paylibo API, které vygeneruje platební QR kód. Výsledný QR kód a klíčové detaily objednávky jsou pak automaticky vloženy do sdíleného Google Sheetu, který slouží jako jednoduché rozhraní pro personál na prodejně.

Použité technologie:
Google Apps Script, Shopify REST API, Paylibo API, Google Sheets.

Výsledek:
Proces platby na prodejně se výrazně zrychlil a snížila se chybovost. Řešení je plně automatizované a škálovatelné.