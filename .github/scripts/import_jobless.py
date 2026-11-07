import io
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0"})
candidates = []
for page in [
    "https://www.mast.org/it_IT/jobless-society-forum-lavoro-intelligente",
    "https://www.mast.org/",
]:
    response = session.get(page, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup.find_all("img"):
        alt = (tag.get("alt") or "").lower()
        if "jobless" not in alt and "lavoro intelligente" not in alt:
            continue
        for key in ["src", "data-src", "data-lazy-src"]:
            url = tag.get(key)
            if url and not url.startswith("data:"):
                candidates.append(urljoin(page, url))
        for key in ["srcset", "data-srcset"]:
            for part in (tag.get(key) or "").split(","):
                url = part.strip().split(" ")[0]
                if url:
                    candidates.append(urljoin(page, url))
    print("Found candidates:", candidates, flush=True)

output = Path("assets/events/jobless-society-forum-2026.jpg")
for url in dict.fromkeys(candidates):
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        img = Image.open(io.BytesIO(response.content))
        if img.width < 320 or img.height < 180:
            continue
        output.parent.mkdir(parents=True, exist_ok=True)
        img.convert("RGB").save(output, "JPEG", quality=90, optimize=True)
        print("Official image:", url, img.size, flush=True)
        break
    except Exception as exc:
        print("Skipping", url, exc, flush=True)
if not output.exists():
    raise RuntimeError("Official image could not be fetched; site unchanged")

page = Path("index.html")
html = page.read_text()
start = html.index('            <div class="event-visual jobless">')
end = html.index('            <div>\n              <div class="event-meta">', start)
new = '''            <div class="event-visual jobless">
              <a href="https://www.mast.org/it_IT/jobless-society-forum-lavoro-intelligente" target="_blank" rel="noopener noreferrer" aria-label="Official Jobless Society Forum artwork">
                <img src="assets/events/jobless-society-forum-2026.jpg" alt="VIII Jobless Society Forum — Lavoro Intelligente: official event graphic" loading="lazy">
              </a>
              <small data-en="Image: Fondazione MAST / Fondazione Feltrinelli" data-it="Immagine: Fondazione MAST / Fondazione Feltrinelli">Image: Fondazione MAST / Fondazione Feltrinelli</small>
            </div>
'''
page.write_text(html[:start] + new + html[end:])
