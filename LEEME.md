# BTS Merch Vault en GitHub

1. Repo PÚBLICO `bts-vault`: sube index.html, style.css, app.js, manifest.webmanifest, icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png (Add file → Upload files). Settings → Pages → Branch main, / (root). Tu URL: https://TU-USUARIO.github.io/bts-vault/
2. Repo PRIVADO `bts-vault-data` (marca "Add a README"): sube data.json.
3. Settings (tu perfil) → Developer settings → Fine-grained tokens → Generate: Repository access = solo bts-vault-data; Permissions → Contents: Read and write. Guarda el token.
4. Abre la URL de Pages → ☁ → repo `usuario/bts-vault-data`, rama main, archivo data.json, token → Guardar y probar.
5. En el mismo panel: "Copiar enlace de configuración" y ábrelo en el celular (es como una contraseña).
6. Opcional: importa tu estado anterior pegando el JSON (consola de la app vieja: copy(localStorage.getItem('bts-vault-v6'))).
7. Celular: Compartir / menú → Agregar a pantalla de inicio.

## Excel
- La fuente de verdad es data.json en GitHub (no el Excel). Ajustes (☁) → "Descargar Excel (.xlsx)" genera un Excel con tus columnas actuales y los cambios hechos en la página.
- "Importar Excel / JSON" sube un .xlsx con el mismo formato y actualiza/agrega items (no borra nada).
