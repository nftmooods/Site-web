# Assemble les pages : en-tête et pied de page communs (Sources/parts) + contenu de chaque page (Sources/pages).
# Usage : python3 Sources/build-site.py   (à lancer depuis le dossier Site_martinlisen ou n importe où)

import re, pathlib, sys, hashlib

# ---- Statistiques de visite (Umami, auto-hébergé sur le VPS) --------------------------------
# Renseigner les deux valeurs ci-dessous (Umami → Settings → Websites → martinlisen.com → Edit),
# puis relancer ce script. Tant qu'elles sont vides, aucun script n'est ajouté aux pages.
UMAMI_SCRIPT = 'https://umami.m3ods.cloud/script.js'
UMAMI_WEBSITE_ID = 'a737b9e2-00e0-42c3-a3a6-aa2417741277'
root = pathlib.Path(__file__).resolve().parent
out = root.parent
head = (root/'parts/head.html').read_text(encoding='utf-8')
foot = (root/'parts/footer.html').read_text(encoding='utf-8')
# Empreinte des fichiers statiques : ajoutée en ?v= aux liens CSS/JS, pour que le navigateur
# recharge le fichier après chaque modification au lieu de garder l'ancien en cache.
def stamp(p): return hashlib.sha1((out/p).read_bytes()).hexdigest()[:10]
head = head.replace('{{V:css}}', stamp('assets/css/site.css'))
if UMAMI_SCRIPT and UMAMI_WEBSITE_ID:
    analytics = ('\n<script defer src="%s" data-website-id="%s" data-domains="martinlisen.com"></script>'
                 % (UMAMI_SCRIPT, UMAMI_WEBSITE_ID))
    privacy = 'Aucun cookie posé par ce site · statistiques anonymes, auto-hébergées'
else:
    analytics, privacy = '', 'Aucun cookie posé par ce site'
head = head.replace('{{ANALYTICS}}', analytics)
foot = foot.replace('{{PRIVACY}}', privacy)
foot = foot.replace('{{V:js}}', stamp('assets/js/site.js'))
pages = {
 'index.html': ("Strates Digitales · Martin Lisen — de tes essais IA aux solutions du quotidien",
   "Transforme tes essais IA en méthodes et outils utiles au quotidien. Martin Lisen accompagne les indépendants et petites équipes pour construire des solutions adaptées à leur activité.", '', ''),
 'media.html': ('Le média — Strates Digitales',
   "Strates Digitales, le podcast et la newsletter de Martin Lisen : les nouvelles technologies sans la hype, usages qui marchent, limites et risques.", 'media.html', 'media'),
 'labs.html': ('Le Lab — Strates Digitales',
   "Le Lab, by Strates Digitales : addons Blender, apps et outils construits en public. Certains prennent, d'autres non. Dans les deux cas, un enseignement en sort.", 'labs.html', 'labs'),
 'travailler-avec-moi.html': ('Travailler avec moi — Strates Digitales',
   "De tes premiers essais IA à ton quotidien : ateliers, formations et accompagnement pour construire des méthodes et outils adaptés à ton activité avec Martin Lisen.", 'travailler-avec-moi.html', 'travailler'),
 '404.html': ('Page introuvable — Strates Digitales', "Cette page n'existe pas ou a changé d'adresse.", '404.html', ''),
}
for name,(title,desc,canon,cur) in pages.items():
    body = (root/'pages'/name).read_text(encoding='utf-8')
    h = head.replace('{{TITLE}}',title).replace('{{DESC}}',desc).replace('{{CANON}}',canon)
    h = h.replace('{{ROBOTS}}', '\n<meta name="robots" content="noindex">' if name=='404.html' else '')
    h = re.sub(r'\{\{CUR:(\w+)\}\}', lambda m: ' aria-current="page"' if m.group(1)==cur else '', h)
    (out/name).write_text(h+body+foot, encoding='utf-8')
    print('ok', name, len(h+body+foot))
