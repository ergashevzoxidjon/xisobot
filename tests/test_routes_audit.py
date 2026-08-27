"""
Route'lar statik auditi:
  1. Har bir route himoyalanganmi (@login_required + @permission_required)
  2. Import qilinmagan nom ishlatilyaptimi (AST tahlili)
  3. Eski/o'lik kod qoldiqlari
  4. POST route'lar CSRF'dan chetlatilmaganmi
"""
import ast
import os
import re
import sys

import os
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTE_FILES = ["auth.py", "main.py", "clients.py", "orders.py", "finance.py",
               "stock.py", "suppliers.py", "settings.py"]
ALL_PY = [f for f in os.listdir(APP) if f.endswith(".py")]

fails = []
warns = []

# ---------------------------------------------------------- 1. himoya
print("=== ROUTE HIMOYASI ===")
# ataylab ochiq qoldirilgan route'lar
PUBLIC = {"auth.login", "auth.logout", "auth.change_password", "main.dashboard"}

for fname in ROUTE_FILES:
    src = open(f"{APP}/{fname}").read()
    tree = ast.parse(src)
    m = re.search(r'(\w+)\s*=\s*Blueprint\("(\w+)"', src)
    bp_var, bp_name = m.groups()

    for node in ast.walk(tree):
        if not isinstance(node, ast.FunctionDef):
            continue
        decs = []
        is_route = False
        methods = ["GET"]
        for d in node.decorator_list:
            if isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute):
                if d.func.attr == "route" and getattr(d.func.value, "id", None) == bp_var:
                    is_route = True
                    for kw in d.keywords:
                        if kw.arg == "methods":
                            methods = [e.value for e in kw.value.elts]
                elif d.func.attr == "":
                    pass
            if isinstance(d, ast.Name):
                decs.append(d.id)
            elif isinstance(d, ast.Call) and isinstance(d.func, ast.Name):
                arg = d.args[0].value if d.args and isinstance(d.args[0], ast.Constant) else ""
                decs.append(f"{d.func.id}({arg})")
        if not is_route:
            continue

        ep = f"{bp_name}.{node.name}"
        has_login = "login_required" in decs
        has_perm = any(d.startswith("permission_required") for d in decs)

        if ep in PUBLIC:
            note = "ataylab ochiq" if ep in ("auth.login",) else "login talab qilinadi"
            status = "OK  "
            if ep != "auth.login" and not has_login:
                fails.append(f"{ep}: @login_required yo'q")
                status = "FAIL"
            print(f"  {status} {ep:<32} {','.join(methods):<12} ({note})")
            continue

        if has_login and has_perm:
            perm = next(d for d in decs if d.startswith("permission_required"))
            print(f"  OK   {ep:<32} {','.join(methods):<12} {perm}")
        else:
            missing = []
            if not has_login:
                missing.append("@login_required")
            if not has_perm:
                missing.append("@permission_required")
            fails.append(f"{ep}: {' va '.join(missing)} yo'q")
            print(f"  FAIL {ep:<32} — {' va '.join(missing)} YO'Q")

# ---------------------------------------------------------- 2. aniqlanmagan nomlar
print("\n=== ANIQLANMAGAN NOMLAR (AST) ===")
BUILTINS = set(dir(__builtins__)) | {
    "__name__", "__file__", "self", "cls", "True", "False", "None",
}

for fname in sorted(ALL_PY):
    src = open(f"{APP}/{fname}").read()
    tree = ast.parse(src)

    defined = set()
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            for a in node.names:
                defined.add((a.asname or a.name).split(".")[0])
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            defined.add(node.name)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for a in node.args.args + node.args.kwonlyargs + node.args.posonlyargs:
                    defined.add(a.arg)
                if node.args.vararg:
                    defined.add(node.args.vararg.arg)
                if node.args.kwarg:
                    defined.add(node.args.kwarg.arg)
        elif isinstance(node, ast.Lambda):
            for a in node.args.args + node.args.kwonlyargs + node.args.posonlyargs:
                defined.add(a.arg)
            if node.args.vararg:
                defined.add(node.args.vararg.arg)
            if node.args.kwarg:
                defined.add(node.args.kwarg.arg)
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            defined.add(node.id)
        elif isinstance(node, (ast.comprehension,)):
            for n in ast.walk(node.target):
                if isinstance(n, ast.Name):
                    defined.add(n.id)
        elif isinstance(node, ast.ExceptHandler) and node.name:
            defined.add(node.name)
        elif isinstance(node, (ast.With, ast.AsyncWith)):
            for item in node.items:
                if item.optional_vars:
                    for n in ast.walk(item.optional_vars):
                        if isinstance(n, ast.Name):
                            defined.add(n.id)
        elif isinstance(node, ast.Global):
            defined.update(node.names)

    used = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load)}
    undefined = used - defined - BUILTINS
    if undefined:
        fails.append(f"{fname}: aniqlanmagan nom(lar): {sorted(undefined)}")
        print(f"  FAIL {fname}: {sorted(undefined)}")
    else:
        print(f"  OK   {fname}")

# ---------------------------------------------------------- 3. o'lik kod / qoldiqlar
print("\n=== ESKI KOD QOLDIQLARI ===")
patterns = {
    r"\.paid_amount\s*\+=": "eski to'lov mantig'i (paid_amount +=)",
    r"debug\s*=\s*True": "qattiq yozilgan debug=True",
    r"datetime\.utcnow": "UTC vaqt (mahalliy vaqt ishlatilishi kerak)",
    r"float\(request\.form": "tekshirilmagan float() o'qish",
    r"int\(request\.form": "tekshirilmagan int() o'qish",
}
found_any = False
for fname in sorted(ALL_PY):
    # migrate_db.py ataylab eski jadval nomlarini eslatadi (u ularni o'chiradi)
    if fname == "migrate_db.py":
        continue
    src = open(f"{APP}/{fname}").read()
    for pat, desc in patterns.items():
        for m in re.finditer(pat, src):
            line = src[:m.start()].count("\n") + 1
            fails.append(f"{fname}:{line} — {desc}")
            print(f"  FAIL {fname}:{line} — {desc}: {m.group(0)}")
            found_any = True
if not found_any:
    print("  OK   eski kod qoldig'i topilmadi")

# ---------------------------------------------------------- 3b. skalyar ro'yxatni obyekt sifatida ishlatish
# Haqiqiy xato misoli:
#     ids = [c.id for c in items]              -> ids: raqamlar ro'yxati
#     {c.id: i for i, c in enumerate(ids)}     -> c bu raqam, .id YO'Q  => 500 xato
print("\n=== SKALYAR RO'YXATNI OBYEKT SIFATIDA ISHLATISH ===")

def scalar_list_vars(tree):
    """`x = [<biror>.attr for ...]` ko'rinishidagi o'zgaruvchilar nomi."""
    found = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            value = node.value
            if isinstance(target, ast.Name) and isinstance(value, ast.ListComp):
                if isinstance(value.elt, ast.Attribute):
                    found[target.id] = value.elt.attr
    return found


def flag_attr_on_scalars(tree, scalars):
    """Skalyar ro'yxat bo'ylab aylanib, element atributiga murojaat qilingan joylar."""
    problems = []

    def iterated_name(iter_node):
        """`for ... in X` yoki `for ... in enumerate(X)` dagi X nomi."""
        if isinstance(iter_node, ast.Name):
            return iter_node.id
        if isinstance(iter_node, ast.Call) and isinstance(iter_node.func, ast.Name):
            if iter_node.func.id in ("enumerate", "reversed", "sorted", "list"):
                if iter_node.args and isinstance(iter_node.args[0], ast.Name):
                    return iter_node.args[0].id
        return None

    def target_names(target):
        names = []
        for n in ast.walk(target):
            if isinstance(n, ast.Name):
                names.append(n.id)
        return names

    def check(generators, body_nodes):
        for gen in generators:
            src_name = iterated_name(gen.iter)
            if src_name not in scalars:
                continue
            loop_vars = set(target_names(gen.target))
            for b in body_nodes:
                for n in ast.walk(b):
                    if (isinstance(n, ast.Attribute)
                            and isinstance(n.value, ast.Name)
                            and n.value.id in loop_vars):
                        problems.append((src_name, n.value.id, n.attr, getattr(n, "lineno", "?")))

    for node in ast.walk(tree):
        if isinstance(node, (ast.ListComp, ast.SetComp, ast.GeneratorExp)):
            check(node.generators, [node.elt])
        elif isinstance(node, ast.DictComp):
            check(node.generators, [node.key, node.value])
        elif isinstance(node, ast.For):
            src_name = iterated_name(node.iter)
            if src_name in scalars:
                loop_vars = set(target_names(node.target))
                for b in node.body:
                    for n in ast.walk(b):
                        if (isinstance(n, ast.Attribute)
                                and isinstance(n.value, ast.Name)
                                and n.value.id in loop_vars):
                            problems.append((src_name, n.value.id, n.attr, getattr(n, "lineno", "?")))
    return problems


found_scalar_bug = False
for fname in sorted(ALL_PY):
    tree = ast.parse(open(f"{APP}/{fname}").read())
    scalars = scalar_list_vars(tree)
    if not scalars:
        continue
    for src_name, var, attr, line in flag_attr_on_scalars(tree, scalars):
        fails.append(
            f"{fname}:{line} — '{src_name}' skalyar ro'yxat, lekin '{var}.{attr}' deb murojaat qilingan"
        )
        print(f"  FAIL {fname}:{line} — {var}.{attr} (lekin {src_name} raqamlar ro'yxati)")
        found_scalar_bug = True
if not found_scalar_bug:
    print("  OK   skalyar ro'yxat noto'g'ri ishlatilgan joy topilmadi")

# ---------------------------------------------------------- 4. CSRF chetlatish
print("\n=== CSRF CHETLATISH TEKSHIRUVI ===")
exempt = []
for fname in sorted(ALL_PY):
    src = open(f"{APP}/{fname}").read()
    if "csrf.exempt" in src or "csrf_exempt" in src:
        exempt.append(fname)
if exempt:
    fails.append(f"CSRF chetlatilgan: {exempt}")
    print(f"  FAIL CSRF chetlatilgan fayllar: {exempt}")
else:
    print("  OK   hech bir route CSRF'dan chetlatilmagan")

# ---------------------------------------------------------- 5. modellar
print("\n=== MODEL TEKSHIRUVI ===")
models_src = open(f"{APP}/models.py").read()
checks = [
    ("Payment klassi", r"class Payment\(db\.Model\)", True),
    ("OrderType klassi", r"class OrderType\(db\.Model\)", True),
    ("AuditLog klassi", r"class AuditLog\(db\.Model\)", True),
    ("Material klassi (ombor)", r"class Material\(db\.Model\)", True),
    ("StockMove klassi (ombor harakati)", r"class StockMove\(db\.Model\)", True),
    ("Numeric pul turi", r"MONEY = db\.Numeric\(14, 2\)", True),
    ("Expense.created_by", r"created_by = db\.Column\(db\.Integer, db\.ForeignKey\(\"user\.id\"\)\)", True),
    ("User.is_active_user", r"is_active_user = db\.Column", True),
    ("Float pul ustuni (bo'lmasligi kerak)", r"db\.Column\(db\.Float", False),
]
for desc, pat, should in checks:
    found = bool(re.search(pat, models_src))
    if found == should:
        print(f"  OK   {desc}")
    else:
        fails.append(f"model: {desc} — {'topilmadi' if should else 'topildi'}")
        print(f"  FAIL {desc}")

# total_debt bekor qilinganlarni chiqarib tashlaydimi
if re.search(r"def total_debt.*?STATUS_CANCELLED", models_src, re.S):
    print("  OK   total_debt bekor qilingan buyurtmalarni hisoblamaydi")
else:
    fails.append("total_debt bekor qilinganlarni hali ham hisoblaydi")
    print("  FAIL total_debt bekor qilinganlarni chiqarib tashlamaydi")

print()
if fails:
    print(f"XATOLAR ({len(fails)}):")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("ROUTE AUDITI MUVAFFAQIYATLI")
