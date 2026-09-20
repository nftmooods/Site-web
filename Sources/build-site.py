# Assemble les pages : en-tête et pied de page communs (Sources/parts) + contenu de chaque page (Sources/pages).
# Usage : python3 Sources/build-site.py   (à lancer depuis le dossier Site_martinlisen ou n importe où)

import re, pathlib, sys
root = pathlib.Path(__file__).resolve().parent
out = root.parent
head = (root/'parts/head.html').read_text()
foot = (root/'parts/footer.html').read_text()
pages = {
 'index.html': ('Strates Digitales · Martin Lisen — transformer tes essais IA en gestes du quotidien',
   "Avec l'IA, chaque fois c'est la première fois ? Martin Lisen, consultant et formateur IA, transforme tes essais en gestes du quotidien qui font gagner du temps ou de l'argent.", '', ''),
 'media.html': ('Le média — Strates Digitales',
   "Strates Digitales, le podcast et la newsletter de Martin Lisen : les nouvelles technologies sans la hype, usages qui marchent, limites et risques.", 'media.html', 'media'),
 'labs.html': ('Les Labs — Strates Digitales',
   "Labs by Strates Digitales : addons Blender, apps et outils construits en public. Certains prennent, d'autres non. Dans les deux cas, un enseignement en sort.", 'labs.html', 'labs'),
 'travailler-avec-moi.html': ('Travailler avec moi — Strates Digitales',
   "Ateliers courts, formations et accompagnement pour transformer tes essais IA en gestes du quotidien. Réserve un échange avec Martin Lisen.", 'travailler-avec-moi.html', 'travailler'),
 '404.html': ('Page introuvable — Strates Digitales', "Cette page n'existe pas ou a changé d'adresse.", '404.html', ''),
}
for name,(title,desc,canon,cur) in pages.items():
    body = (root/'pages'/name).read_text()
    h = head.replace('{{TITLE}}',title).replace('{{DESC}}',desc).replace('{{CANON}}',canon)
    h = re.sub(r'\{\{CUR:(\w+)\}\}', lambda m: ' aria-current="page"' if m.group(1)==cur else '', h)
    (out/name).write_text(h+body+foot)
    print('ok', name, len(h+body+foot))
