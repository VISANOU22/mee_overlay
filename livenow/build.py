#!/usr/bin/env python3
"""Build petanque-livenow.html (one self-contained file for Live Now "Import overlay").

usage: python3 livenow/build.py FONT_DIR
FONT_DIR = node_modules/@fontsource (from: npm i @fontsource/noto-sans-lao@5 @fontsource/oswald@5)
"""
import base64, json, os, sys

here = os.path.dirname(os.path.abspath(__file__))
fd = sys.argv[1]
LAO = "U+0E81-0EDF,U+200C-200D,U+25CC"
LAT = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
faces = [("Noto Sans Lao", "noto-sans-lao/files/noto-sans-lao-lao-%d-normal.woff2", LAO, w) for w in (700, 900)]
faces += [("Noto Sans Lao", "noto-sans-lao/files/noto-sans-lao-latin-%d-normal.woff2", LAT, w) for w in (700, 900)]
faces += [("Oswald", "oswald/files/oswald-latin-%d-normal.woff2", LAT, 700)]
css = ""
for fam, path, rng, w in faces:
    data = base64.b64encode(open(os.path.join(fd, path % w), "rb").read()).decode()
    css += "  @font-face { font-family:'%s'; font-weight:%d; font-style:normal; font-display:block; unicode-range:%s;\n    src:url(data:font/woff2;base64,%s) format('woff2'); }\n" % (fam, w, rng, data)
state = json.dumps(json.load(open(os.path.join(here, "state.json"), encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))
src = open(os.path.join(here, "petanque-livenow.src.html"), encoding="utf-8").read()
out = src.replace("/*@FONTS@*/", css.rstrip("\n")).replace("/*@STATE@*/", state)
assert "/*@" not in out
dst = os.path.join(here, "..", "petanque-livenow.html")
open(dst, "w", encoding="utf-8").write(out)
print("wrote", os.path.normpath(dst), len(out.encode()), "bytes")
