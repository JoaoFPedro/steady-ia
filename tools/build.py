#!/usr/bin/env python3
"""Gera as superfícies de IDE a partir da fonte única em kit/workflow/.

    python3 tools/build.py           # escreve os adapters
    python3 tools/build.py --check   # falha se algum adapter divergiu da fonte

Os IDEs exigem caminhos fixos (.claude/commands/, .github/prompts/), então esses
diretórios são ARTEFATOS GERADOS — edite kit/workflow/, nunca a saída.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "kit" / "workflow"
RULES = ROOT / "kit" / "rules"
MODELS = json.loads((ROOT / "kit" / "models.json").read_text(encoding="utf-8"))

BANNER = "<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->"


def parse(path):
    raw = path.read_text(encoding="utf-8")
    if not raw.startswith("---\n"):
        raise SystemExit(f"{path}: frontmatter ausente")
    _, fm, body = raw.split("---\n", 2)
    meta = {}
    for line in fm.splitlines():
        if not line.strip() or ":" not in line:
            continue
        k, v = line.split(":", 1)
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [i.strip() for i in v[1:-1].split(",") if i.strip()]
        meta[k.strip()] = v
    return meta, body.strip("\n")


def linkify(body, prefix="../../"):
    """Caminhos .sdd/ viram links relativos — só nas listas de pré-condições."""
    return re.sub(
        r"^(\s*[-*] )`(\.sdd/[^`]+)`",
        lambda m: f"{m.group(1)}[{m.group(2)}]({prefix}{m.group(2)})",
        body,
        flags=re.M,
    )


def with_instructions(body, names, make_link):
    """Insere o ponteiro para as regras complementares ao fim das pré-condições."""
    if not names:
        return body
    links = ", ".join(make_link(n) for n in names)
    note = f"\nAplique também as regras de {links}.\n"
    lines = body.splitlines(keepends=True)
    start = next((i for i, l in enumerate(lines) if l.startswith("## Pré-condições")), None)
    if start is None:
        return body + "\n" + note
    end = next(
        (i for i in range(start + 1, len(lines)) if lines[i].startswith(("## ", "---"))),
        len(lines),
    )
    return "".join(lines[:end] + [note] + lines[end:])


def render(meta, body):
    name = meta["name"]
    out = {}
    targets = meta.get("targets") or ["claude", "copilot", "codex"]

    if "claude" in targets:
        # frontmatter primeiro: o Claude Code lê `description` daqui. Sem ela,
        # a primeira linha do arquivo (o banner) vira a descrição do comando.
        fm = ["---", f"description: {meta['description']}"]
        if meta.get("argument-hint", "nenhum") != "nenhum":
            fm.append(f"argument-hint: {meta['argument-hint']}")
        fm.append("---")
        out[ROOT / ".claude" / "commands" / f"{name}.md"] = "\n".join(
            fm + ["", BANNER, "", f"## /{name}", "", body, ""]
        )

    if "copilot" in targets:
        fm = [
            "---",
            f"description: {meta['description']}",
            f"agent: {meta.get('agent', 'agent')}",
            f"model: {MODELS[meta.get('model', 'execution')]}",
        ]
        if meta.get("argument-hint", "nenhum") != "nenhum":
            fm.append(f"argument-hint: {meta['argument-hint']}")
        fm.append("---")
        head = f"# /{name} — {meta['title']} ({meta['role']})"
        text = with_instructions(
            linkify(body), meta.get("instructions") or [],
            lambda n: f"[{n}.instructions.md](../instructions/{n}.instructions.md)",
        )
        out[ROOT / ".github" / "prompts" / f"{name}.prompt.md"] = "\n".join(
            fm + ["", BANNER, "", head, "", text, ""]
        )

    if "codex" in targets:
        # Skills são o mecanismo atual do Codex CLI — custom prompts (.md solto em
        # ~/.codex/prompts/, só global) foram descontinuados em favor de skills
        # (.codex/skills/<nome>/SKILL.md, escopo de projeto). Invocação: `$nome`
        # explícito ou seleção automática por `description`. O frontmatter de
        # skill só aceita name/description — sem argument-hint, por isso o
        # argumento vira uma nota no corpo.
        fm = ["---", f"name: {name}", f"description: {meta['description']}", "---"]
        text = with_instructions(
            linkify(body, "../../../"), meta.get("instructions") or [],
            lambda n: f"[{n}.md](../../../kit/rules/{n}.md)",
        )
        head = [BANNER, "", f"# {meta['title']}"]
        hint = meta.get("argument-hint", "nenhum")
        if hint != "nenhum":
            head += ["", f"> Argumento esperado: {hint}"]
        out[ROOT / ".codex" / "skills" / name / "SKILL.md"] = "\n".join(
            fm + [""] + head + ["", text, ""]
        )

    return out


def render_rule(meta, body):
    """Regras de arquivo: mesma fonte, dois dialetos de frontmatter."""
    name, out = meta["name"], {}
    targets = meta.get("targets") or ["cursor", "copilot"]
    head = f"# {meta['title']}"

    if "cursor" in targets:
        fm = [
            "---",
            f"description: {meta['description']}",
            f'globs: "{meta["applies"]}"',
            f"alwaysApply: {meta.get('always', 'false')}",
            "---",
        ]
        out[ROOT / ".cursor" / "rules" / f"{name}.mdc"] = "\n".join(
            fm + ["", BANNER, "", head, "", body, ""]
        )

    if "copilot" in targets:
        fm = ["---", f'applyTo: "{meta["applies"]}"', "---"]
        out[ROOT / ".github" / "instructions" / f"{name}.instructions.md"] = "\n".join(
            fm + ["", BANNER, "", head, "", body, ""]
        )
    return out


def main():
    check = "--check" in sys.argv
    drift, written = [], 0
    jobs = [(src, render) for src in sorted(SRC.glob("*.md"))]
    jobs += [(src, render_rule) for src in sorted(RULES.glob("*.md"))]
    for src, fn in jobs:
        for dest, content in fn(*parse(src)).items():
            current = dest.read_text(encoding="utf-8") if dest.exists() else None
            if current == content:
                continue
            if check:
                drift.append(dest.relative_to(ROOT))
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(content, encoding="utf-8")
                written += 1
    if check:
        if drift:
            print("DRIFT — adapters fora de sincronia com kit/workflow/:")
            for d in drift:
                print(f"  {d}")
            print("\nRode: python3 tools/build.py")
            return 1
        print("OK — adapters em sincronia com a fonte única")
        return 0
    n = len(list(SRC.glob("*.md"))) + len(list(RULES.glob("*.md")))
    print(f"OK — {written} adapter(s) gerado(s) a partir de {n} fontes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
