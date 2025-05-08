import os
import subprocess
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString

BASE_URL = "https://zenzonecleaning.ca"
OUTPUT_FILE = "sitemap.xml"

pages = {
    "index.html": 1.00,
    "booking.html": 0.80,
    "blogs.html": 0.80,
    "blogs/barrie-deep-cleaning.html": 0.75,
    "blogs/professional-cleaning-saves-you-money-time.html": 0.75,
    "blogs/10-cleaning-mistakes.html": 0.75,
    "blogs/declutter-your-space-declutter-your-mind.html": 0.75,
    "blogs/office-cleaning-frequency.html": 0.75,
    "blogs/discover-cleaning-services.html": 0.64,
    "privacy-policy.html": 0.30,
    "terms-of-service.html": 0.30,
    "thankyou.html": 0.10,
}

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

    for file, priority in pages.items():
        if not os.path.isfile(file):
            print(f"⚠️  Skipping missing file: {file}")
            continue

        lastmod = get_lastmod(file)
        if not lastmod:
            print(f"⚠️  Skipping untracked file: {file}")
            continue

        url = BASE_URL + "/" + file if file != "index.html" else BASE_URL + "/"

        url_elem = SubElement(urlset, "url")
        SubElement(url_elem, "loc").text = url
        SubElement(url_elem, "lastmod").text = lastmod
        SubElement(url_elem, "priority").text = f"{priority:.2f}"

    # Convert to pretty XML string
    rough_xml = tostring(urlset, "utf-8")
    pretty_xml = parseString(rough_xml).toprettyxml(indent="  ")

    # Write to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(pretty_xml)

    print(f"✅ Generated {OUTPUT_FILE} with pretty formatting")

if __name__ == "__main__":
    generate_sitemap()