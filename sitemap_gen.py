import os
import subprocess
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString

BASE_URL = "https://zenzonecleaning.ca"
OUTPUT_FILE = "sitemap.xml"

# Rules to assign priority based on filename patterns
def get_priority(file):
    if file == "index.html":
        return 1.00
    if "booking" in file:
        return 0.80
    if "blogs/" in file:
        return 0.75
    if "privacy" in file or "terms" in file:
        return 0.30
    if "thankyou" in file:
        return 0.10
    return 0.60  # default fallback

def get_lastmod(filepath):
    try:
        return subprocess.check_output(
            ["git", "log", "-1", "--format=%cI", "--", filepath],
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
    except subprocess.CalledProcessError:
        return None

def generate_sitemap():
    urlset = Element("urlset", {
        "xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "http://www.sitemaps.org/schemas/sitemap/0.9 "
                              "http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
    })

    for root, _, files in os.walk("."):
        for file in files:
            if not file.endswith(".html"):
                continue
            
            filepath = os.path.join(root, file)
            relative_path = os.path.relpath(filepath, ".").replace("\\", "/")
            if "navbar.html" in relative_path:
                continue
            lastmod = get_lastmod(filepath)
            if not lastmod:
                continue

            # Format URL
            url = BASE_URL + "/" + relative_path
            if relative_path == "index.html":
                url = BASE_URL + "/"

            priority = get_priority(relative_path)

            url_elem = SubElement(urlset, "url")
            SubElement(url_elem, "loc").text = url
            SubElement(url_elem, "lastmod").text = lastmod
            SubElement(url_elem, "priority").text = f"{priority:.2f}"

    # Pretty-print XML
    rough_xml = tostring(urlset, "utf-8")
    pretty_xml = parseString(rough_xml).toprettyxml(indent="  ")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(pretty_xml)

    print(f"✅ Generated {OUTPUT_FILE} with auto-detected pages")

if __name__ == "__main__":
    generate_sitemap()