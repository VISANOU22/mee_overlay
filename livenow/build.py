#!/usr/bin/env python3
"""Build scoreboard-badminton-petanque.html for Live Now "Import overlay".

Takes a scoreboard exported from Live Now (badminton type, which imports fine),
keeps it byte-for-byte, and injects livenow/petanque-inject.html before </body>.

usage: python3 livenow/build.py BASE_BADMINTON.html FONT_DIR
FONT_DIR = node_modules/@fontsource (npm i @fontsource/noto-sans-lao@5 @fontsource/oswald@5)
"""
import base64, os, sys

here = os.path.dirname(os.path.abspath(__file__))
base, fd = sys.argv[1], sys.argv[2]
LAO = "U+0E81-0EDF,U+200C-200D,U+25CC"
LAT = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
faces = [("Noto Sans Lao", "noto-sans-lao/files/noto-sans-lao-%s-%d-normal.woff2", sub, rng, w)
         for sub, rng in (("lao", LAO), ("latin", LAT)) for w in (700, 900)]
faces += [("Oswald", "oswald/files/oswald-%s-%d-normal.woff2", "latin", LAT, 700)]
css = ""
for fam, path, sub, rng, w in faces:
    data = base64.b64encode(open(os.path.join(fd, path % (sub, w)), "rb").read()).decode()
    css += "  @font-face { font-family:'%s'; font-weight:%d; font-style:normal; font-display:block; unicode-range:%s;\n    src:url(data:font/woff2;base64,%s) format('woff2'); }\n" % (fam, w, rng, data)
inject = open(os.path.join(here, "petanque-inject.html"), encoding="utf-8").read().replace("/*@FONTS@*/", css.rstrip("\n"))
src = open(base, encoding="utf-8").read()
assert '"type":"badminton"' in src, "base file must be a Live Now badminton scoreboard"
i = src.rindex("</body>")
out = src[:i] + inject + src[i:]
dst = os.path.normpath(os.path.join(here, "..", "scoreboard-badminton-petanque.html"))
open(dst, "w", encoding="utf-8").write(out)
print("wrote", dst, len(out.encode()), "bytes")
