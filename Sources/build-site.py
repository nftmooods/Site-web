# Assemble les pages : en-tête et pied de page communs (Sources/parts) + contenu de chaque page (Sources/pages).
# Usage : python3 Sources/build-site.py   (à lancer depuis le dossier Site_martinlisen ou n importe où)

import re, pathlib, sys, hashlib, json, subprocess, datetime

# ---- Statistiques de visite (Umami, auto-hébergé sur le VPS) --------------------------------
# Renseigner les deux valeurs ci-dessous (Umami → Settings → Websites → martinlisen.com → Edit),
# puis relancer ce script. Tant qu'elles sont vides, aucun script n'est ajouté aux pages.
UMAMI_SCRIPT = 'https://stats.martinlisen.com/kit.js'
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
 'index.html': ("Martin Lisen · Formateur et consultant IA en Belgique",
   "Formateur et consultant IA en Belgique : ateliers, formations et accompagnement pour transformer tes essais IA en méthodes et outils du quotidien.", '', ''),
 'media.html': ('Podcast et newsletter IA · Strates Digitales',
   "Strates Digitales, le podcast et la newsletter de Martin Lisen : les nouvelles technologies sans la hype, usages qui marchent, limites et risques.", 'media.html', 'media'),
 'labs.html': ('Le Lab : addons Blender et outils IA · Strates Digitales',
   "Le Lab de Martin Lisen : addons Blender, assistants IA et applications construits en public. À acheter, réservés aux membres, en construction ou sur mesure.", 'labs.html', 'labs'),
 'travailler-avec-moi.html': ('Formation et accompagnement IA en Wallonie · Martin Lisen',
   "Ateliers, formations (Chèque-Formation) et accompagnement IA en Wallonie : construis des méthodes et outils adaptés à ton activité avec Martin Lisen.", 'travailler-avec-moi.html', 'travailler'),
 '404.html': ('Page introuvable — Strates Digitales', "Cette page n'existe pas ou a changé d'adresse.", '404.html', ''),
}

# ---- Données structurées (schema.org) : à tenir à jour avec le contenu des pages -------------------
BASE = 'https://martinlisen.com'
PERSON = {"@type":"Person","@id":BASE+"/#martin","name":"Martin Lisen","url":BASE+"/","jobTitle":"Consultant et formateur IA",
  "email":"mailto:info@martinlisen.com","address":{"@type":"PostalAddress","addressCountry":"BE"},
  "worksFor":{"@id":BASE+"/#service"},
  "knowsAbout":["Intelligence artificielle","Formation professionnelle","Automatisation des tâches","Blender"],
  "sameAs":["https://www.linkedin.com/in/martinlisen/","https://www.youtube.com/@nftmooods","https://superhivemarket.com/creators/martinlisen","https://x.com/nftmooods","https://martinlisenformations.com"]}
SITE = {"@type":"WebSite","@id":BASE+"/#site","name":"Strates Digitales · Martin Lisen","url":BASE+"/","inLanguage":"fr-BE","publisher":{"@id":BASE+"/#martin"}}
AREA = [{"@type":"Country","name":"Belgique"},{"@type":"AdministrativeArea","name":"Wallonie"}]
SERVICE = {"@type":"ProfessionalService","@id":BASE+"/#service","name":"Strates Digitales","url":BASE+"/",
  "image":BASE+"/assets/img/og-strates-digitales.png","founder":{"@id":BASE+"/#martin"},
  "description":"Ateliers, formations et accompagnement IA pour indépendants et petites équipes : transformer des essais IA en méthodes et outils utiles au quotidien.",
  "areaServed":AREA,"address":{"@type":"PostalAddress","addressCountry":"BE"},
  "serviceType":["Formation à l'intelligence artificielle","Atelier IA individuel","Accompagnement à l'intégration de l'IA"]}
ROD = {"@type":"Organization","name":"ROD Formation ASBL","address":{"@type":"PostalAddress","addressLocality":"Mons","addressCountry":"BE"}}
def course(name, desc, code, hours, url):
    return {"@type":"Course","name":name,"description":desc,"courseCode":code,"inLanguage":"fr","timeRequired":"PT%dH"%hours,
            "url":url,"provider":ROD,"instructor":{"@id":BASE+"/#martin"}}
FOREM = 'https://www.leforem.be/catalogue-des-formations/formations/'
def crumbs(label, canon):
    return {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Accueil","item":BASE+"/"},
      {"@type":"ListItem","position":2,"name":label,"item":BASE+"/"+canon}]}
EXTRA = {
 'media.html': [crumbs('Le média','media.html'),
   {"@type":"PodcastSeries","name":"Strates Digitales","url":BASE+"/media.html","inLanguage":"fr",
    "description":"Le podcast de Martin Lisen : les nouvelles technologies sans la hype, usages qui marchent, limites et risques.",
    "author":{"@id":BASE+"/#martin"},"sameAs":["https://open.spotify.com/show/6fwmsmZuQFfP9JjX0eDZ11"]}],
 'labs.html': [crumbs('Le Lab','labs.html'),
   {"@type":"SoftwareApplication","name":"Crumble Toolkit","applicationCategory":"MultimediaApplication","operatingSystem":"Blender",
    "description":"Addon Blender non destructif pour créer de l'usure et des dégâts sur des objets 3D : Damage, Relief, Debris et Drop to Floor.",
    "image":BASE+"/assets/img/crumble-toolkit.webp","url":"https://superhivemarket.com/products/crumble-toolkit","author":{"@id":BASE+"/#martin"}}],
 'travailler-avec-moi.html': [crumbs('Travailler avec moi','travailler-avec-moi.html'),
   {"@type":"Service","name":"Atelier individuel IA","serviceType":"Atelier IA","provider":{"@id":BASE+"/#service"},"areaServed":AREA,
    "description":"Atelier en 1:1 (environ 2 h, en ligne ou sur place) pour transformer un essai IA en méthode réutilisable. Livrable : une fiche de méthode.",
    "offers":{"@type":"Offer","price":"179","priceCurrency":"EUR","priceSpecification":{"@type":"PriceSpecification","price":"179","priceCurrency":"EUR","valueAddedTaxIncluded":False}}},
   course("Comprendre, maîtriser et intégrer l'intelligence artificielle dans son entreprise","Concepts clés et outils, prompts et assistants IA, premières automatisations, cas d'usage métier, charte IA interne, intégration dans la stratégie.","1498-0001-0008",21,FOREM+"d34eae3d-0a07-4779-98c3-e5855578b7f9"),
   course("IA générative et automatisation des tâches, initiation à la semi-automatisation pour PME","Assistants permanents, agents IA, outils no-code et low-code. Chaque participant construit son premier workflow, sous supervision humaine.","1498-0001-0011",11,FOREM+"9cd33fa0-ef94-46f4-8e77-67e67d489cb9"),
   course("Stratégie IA pour PME : cartographier, structurer et déployer l'IA dans l'entreprise","Où l'IA crée de la valeur, diagnostic des prérequis, fiche projet, priorisation de 3 à 5 projets, mini-roadmap à 6-12 mois.","1498-0001-0013",7,FOREM+"2ec9dab2-0871-4ee9-9fed-c74ded4da1c6/strategie-ia-pour-pme-cartographier-structurer-et-deployer-l-ia-dans-l-entreprise"),
   course("Comment opérationnaliser ma stratégie de communication digitale","Stratégie digitale, site internet, réseaux sociaux, e-mailing, outils de création visuelle et analyse des statistiques.","1498-0001-0007",28,FOREM+"70dc1aed-a617-4c16-95e6-82cc51627f31")],
}
def jsonld(name):
    graph = [PERSON, SITE] + ([] if name == '404.html' else [SERVICE]) + EXTRA.get(name, [])
    data = json.dumps({"@context":"https://schema.org","@graph":graph}, ensure_ascii=False, separators=(',',':'))
    return '<script type="application/ld+json">\n' + data + '\n</script>'

for name,(title,desc,canon,cur) in pages.items():
    body = (root/'pages'/name).read_text(encoding='utf-8')
    h = head.replace('{{JSONLD}}', jsonld(name)).replace('{{TITLE}}',title).replace('{{DESC}}',desc).replace('{{CANON}}',canon)
    h = h.replace('{{ROBOTS}}', '\n<meta name="robots" content="noindex">' if name=='404.html' else '')
    h = re.sub(r'\{\{CUR:(\w+)\}\}', lambda m: ' aria-current="page"' if m.group(1)==cur else '', h)
    (out/name).write_text(h+body+foot, encoding='utf-8')
    print('ok', name, len(h+body+foot))

# ---- Sitemap : date de dernière modification = dernier commit du fichier source (sinon date du fichier)
def lastmod(name):
    src = root/'pages'/name
    try:
        dirty = subprocess.run(['git','status','--porcelain','--',str(src)], cwd=out, capture_output=True, text=True, timeout=10).stdout.strip()
        if not dirty:
            d = subprocess.run(['git','log','-1','--format=%cs','--',str(src)], cwd=out, capture_output=True, text=True, timeout=10).stdout.strip()
            if d: return d
    except Exception:
        pass
    return datetime.date.fromtimestamp(src.stat().st_mtime).isoformat()
urls = [('', 'index.html'), ('media.html','media.html'), ('labs.html','labs.html'), ('travailler-avec-moi.html','travailler-avec-moi.html')]
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for path, src in urls:
    sm += '  <url><loc>%s/%s</loc><lastmod>%s</lastmod></url>\n' % (BASE, path, lastmod(src))
sm += '</urlset>\n'
(out/'sitemap.xml').write_text(sm, encoding='utf-8')
print('ok sitemap.xml')
