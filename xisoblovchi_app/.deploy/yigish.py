#!/usr/bin/env python3
"""yigish.py - bo'lim fayllaridan tayyor index.html ni yig'adi (yigish.ps1 ning Python nusxasi).

Manba:
  umumiy/index.template.html   - sahifa skeleti ("<!-- @include bolim/blok -->" belgilari bilan)
  bolimlar/<nomi>/<nomi>.html  - bo'lim HTML qismlari ("<!-- @blok NOMI --> ... <!-- @/blok -->")
Ishlatish:  python3 .deploy/yigish.py            (Windows: py .deploy\\yigish.py)
            python3 .deploy/yigish.py --majburiy - index.html qo'lda o'zgartirilgan bo'lsa ham ustidan yozadi
Himoya: index.html ichiga "yigish-hash" yoziladi; fayl qo'lda tahrirlangan bo'lsa skript to'xtaydi.
Chiqish kodi: 0 - muvaffaqiyat, 1 - xato.
"""
import hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def oqi(p):
    # .NET ReadAllText(UTF8) kabi: BOM olib tashlanadi, noto'g'ri baytlar U+FFFD bo'ladi (logo.png ham)
    with open(p, "rb") as f:
        return f.read().decode("utf-8-sig", errors="replace").replace("\r\n", "\n")


def xesh(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def xato(m):
    print("XATO: " + m)
    sys.exit(1)


def main():
    majburiy = any(a.lower() in ("--majburiy", "-majburiy") for a in sys.argv[1:])
    tpl_path = os.path.join(ROOT, "umumiy", "index.template.html")
    out_path = os.path.join(ROOT, "index.html")
    if not os.path.exists(tpl_path):
        xato("umumiy/index.template.html topilmadi.")

    # 1) Bo'limlarning HTML bloklari
    bloklar = {}
    bdir = os.path.join(ROOT, "bolimlar")
    for nom in sorted(os.listdir(bdir), key=str.lower):
        d = os.path.join(bdir, nom)
        f = os.path.join(d, nom + ".html")
        if not os.path.isdir(d) or not os.path.exists(f):
            continue
        for m in re.finditer(r"<!-- @blok (\S+) -->\n(.*?)<!-- @/blok -->", oqi(f), re.S):
            kalit = nom + "/" + m.group(1)
            if kalit in bloklar:
                xato(f"'{kalit}' bloki ikki marta yozilgan ({f}).")
            bloklar[kalit] = m.group(2)

    # 2) Shablondagi @include belgilarini almashtirish
    qatorlar = oqi(tpl_path).split("\n")
    qism, ishlatilgan = [], set()
    for i, q in enumerate(qatorlar):
        m = re.match(r"^\s*<!-- @include (\S+) -->\s*$", q)
        if m:
            kalit = m.group(1)
            if kalit not in bloklar:
                b = kalit.split("/")[0]
                xato(f"Shablonda '{kalit}' so'ralgan, lekin bunday blok yo'q (bolimlar/{b}/{b}.html).")
            qism.append(bloklar[kalit])
            ishlatilgan.add(kalit)
            continue
        qism.append(q)
        if i < len(qatorlar) - 1:
            qism.append("\n")
    tana = "".join(qism)
    for k in bloklar:
        if k not in ishlatilgan:
            print(f"OGOHLANTIRISH: '{k}' bloki hech qayerda ishlatilmagan.")

    # 3) Havola qilingan CSS/JS fayllar mavjudmi
    for m in re.finditer(r'(?:src|href)="((?:umumiy|bolimlar)/[^"]+)"', tana):
        if not os.path.exists(os.path.join(ROOT, *m.group(1).split("/"))):
            xato(f"index.html '{m.group(1)}' fayliga havola qiladi, lekin u topilmadi.")

    # 3b) Kesh: havolaga fayl mazmunidan versiya (core.js?v=1a2b3c4d)
    def ver(m):
        p = os.path.join(ROOT, *m.group(2).split("/"))
        with open(p, "rb") as f:
            b = f.read()
        try:  # matn (JS/CSS): qator oxirlaridan qat'i nazar bir xil versiya
            v = xesh(b.decode("utf-8-sig").replace("\r\n", "\n"))
        except UnicodeDecodeError:  # rasm va boshqa ikkilik fayllar: baytlar bo'yicha
            v = hashlib.sha256(b).hexdigest()
        return m.group(1) + m.group(2) + "?v=" + v[:8] + m.group(3)
    tana = re.sub(r'((?:src|href)=")((?:umumiy|bolimlar)/[^"?]+)(")', ver, tana)

    # 4) Mavjud index.html qo'lda o'zgartirilmaganmi
    naqsh = re.compile(r"^<!-- DIQQAT: .*yigish-hash: ([0-9a-f]{16}) -->\n", re.M)
    if os.path.exists(out_path) and not majburiy:
        eski = oqi(out_path)
        hm = naqsh.search(eski)
        if not hm:
            xato("index.html yig'uvchi tomonidan yaratilmagan (yigish-hash yo'q). O'zgarishlarni bo'lim fayllariga ko'chiring, so'ng: --majburiy")
        if xesh(eski[:hm.start()] + eski[hm.end():]) != hm.group(1):
            xato("index.html oxirgi yig'ishdan keyin QO'LDA o'zgartirilgan. O'zgarishlarni bolimlar/ yoki umumiy/ ga ko'chiring (git diff index.html), so'ng: --majburiy")

    # 5) Sarlavha bilan yozish
    sarlavha = ("<!-- DIQQAT: bu fayl AVTOMATIK yig'ilgan (.deploy/yigish.py). To'g'ridan-to'g'ri tahrirlamang - "
                "o'zgarishlarni umumiy/ va bolimlar/ papkalarida qiling, so'ng python3 .deploy/yigish.py ni ishga tushiring. "
                f"yigish-hash: {xesh(tana)} -->\n")
    birinchi = tana.find("\n") + 1
    natija = tana[:birinchi] + sarlavha + tana[birinchi:]
    eski_matn = oqi(out_path) if os.path.exists(out_path) else ""
    if eski_matn == natija:
        print("index.html allaqachon yangi - o'zgarish yo'q.")
    else:
        with open(out_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(natija)
        print(f"Tayyor: index.html yig'ildi ({len(bloklar)} ta blok, {len(natija.split(chr(10)))} qator).")


if __name__ == "__main__":
    main()
