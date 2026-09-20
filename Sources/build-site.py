# Assemble les pages : en-tête et pied de page communs (Sources/parts) + contenu de chaque page (Sources/pages).
# Usage : python3 Sources/build-site.py   (à lancer depuis le dossier Site_martinlisen ou n importe où)

import re, pathlib, sys, hashlib
root = pathlib.Path(__file__).resolve().parent
out = root.parent
head = (root/'parts/head.html').read_text()
foot = (root/'parts/footer.html').read_text()
# Empreinte des fichiers statiques : ajoutée en ?v= aux liens CSS/JS, pour que le navigateur
# recharge le fichier après chaque modification au lieu de garder l'ancien en cache.
def stamp(p): return hashlib.sha1((out/p).read_bytes()).hexdigest()[:10]
head = head.replace('{{V:css}}', stamp('assets/css/site.css'))
foot = foot.replace('{{V:js}}', stamp('assets/js/site.js'))
pages = {
 'index.html': ('Strates Digitales · Martin Lisen — transforme ton usage de l\'IA en outils qui te rendent du temps',
   "Tu as intégré l'IA parce qu'elle change ta façon de travailler. Martin Lisen, consultant et formateur IA, forme les indépendants et les entreprises à en faire des outils du quotidien qui rendent vraiment du temps.", '', ''),
 'media.html': ('Le média — Strates Digitales',
   "Strates Digitales, le podcast et la newsletter de Martin Lisen : les nouvelles technologies sans la hype, usages qui marchent, limites et risques.", 'media.html', 'media'),
 'labs.html': ('Le Lab — Strates Digitales',
   "Le Lab, by Strates Digitales : addons Blender, apps et outils construits en public. Certains prennent, d'autres non. Dans les deux cas, un enseignement en sort.", 'labs.html', 'labs'),
 'travailler-avec-moi.html': ('Travailler avec moi — Strates Digitales',
   "Tes usages IA marchent, comment faire pour qu'ils restent ? Ateliers courts, formations et accompagnement, à partir de tes tâches réelles. Réserve un échange avec Martin Lisen.", 'travailler-avec-moi.html', 'travailler'),
 '404.html': ('Page introuvable — Strates Digitales', "Cette page n'existe pas ou a changé d'adresse.", '404.html', ''),
}
for name,(title,desc,canon,cur) in pages.items():
    body = (root/'pages'/name).read_text()
    h = head.replace('{{TITLE}}',title).replace('{{DESC}}',desc).replace('{{CANON}}',canon)
    h = h.replace('{{ROBOTS}}', '\n<meta name="robots" content="noindex">' if name=='404.html' else '')
    h = re.sub(r'\{\{CUR:(\w+)\}\}', lambda m: ' aria-current="page"' if m.group(1)==cur else '', h)
    (out/name).write_text(h+body+foot)
    print('ok', name, len(h+body+foot))
