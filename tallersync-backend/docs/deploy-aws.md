# Guía de Despliegue en AWS

Esta guía explica cómo subir el backend de TallerSync a AWS.  
La base de datos **no** se mueve — Supabase ya está en la nube.

---

## Opción A — EC2 (manual, más control)

### 1. Crear la instancia EC2

1. Entrar a [AWS Console](https://console.aws.amazon.com)
2. Ir a **EC2 → Launch Instance**
3. Configurar:
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance type:** `t2.micro` (capa gratuita)
   - **Key pair:** crear uno nuevo y guardar el `.pem`
   - **Security group:** abrir puertos `22` (SSH) y `3000` (o `80`) al público

### 2. Conectarse a la instancia

```bash
chmod 400 tu-clave.pem
ssh -i "tu-clave.pem" ubuntu@<IP-publica-de-EC2>
```

### 3. Instalar Node.js en el servidor

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # debe mostrar v18.x
```

### 4. Subir el código

**Opción recomendada — clonar desde GitHub:**
```bash
git clone https://github.com/<tu-usuario>/tallersync-backend.git
cd tallersync-backend
npm install
```

### 5. Crear el archivo .env en el servidor

```bash
nano .env
```
Pegar las variables de entorno con las credenciales reales de Supabase.

### 6. Instalar PM2 para mantener el servidor activo

```bash
sudo npm install -g pm2
pm2 start server.js --name tallersync
pm2 startup      # para que arranque automáticamente si el servidor reinicia
pm2 save
```

### 7. Verificar

```bash
pm2 status
curl http://localhost:3000/health
```

Desde el navegador: `http://<IP-publica-EC2>:3000/health`

---

## Opción B — Elastic Beanstalk (más automático)

### 1. Instalar la CLI de EB

```bash
pip install awsebcli
```

### 2. Inicializar el proyecto

```bash
cd tallersync-backend
eb init tallersync-backend --platform node.js --region us-east-1
```

### 3. Configurar las variables de entorno

En el archivo `.ebextensions/env.config` (crearlo si no existe):

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
    SUPABASE_URL: https://xxxx.supabase.co
    SUPABASE_KEY: tu_anon_key
    JWT_SECRET: tu_secreto
    JWT_EXPIRES_IN: 7d
```

> ⚠️ No subir este archivo a GitHub si contiene credenciales reales.  
> Alternativa: configurar las variables desde el Dashboard de EB.

### 4. Desplegar

```bash
eb create tallersync-env
eb deploy
eb open
```

---

## Variables de entorno necesarias en producción

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (8080 en EB, 3000 en EC2) |
| `NODE_ENV` | Debe ser `production` |
| `SUPABASE_URL` | URL de tu proyecto en Supabase |
| `SUPABASE_KEY` | Anon key de Supabase |
| `JWT_SECRET` | Clave secreta para firmar tokens (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token (ej: `7d`, `24h`) |

---

## Notas importantes

- En producción, el `stack` del error no se muestra en las respuestas (controlado por `NODE_ENV`).
- La base de datos Supabase ya está en la nube — no necesita configuración adicional en AWS.
- Si se usa un dominio propio, configurar **Route 53** apuntando a la IP pública de EC2 o al endpoint de EB.
