# دليل نشر نظام Moonlight Noexis على سيرفر VPS (بيئة الإنتاج)

هذا الدليل يشرح كيفية نقل المشروع من بيئة التطوير (Local) إلى بيئة إنتاج حقيقية (Production) باستخدام سيرفر VPS وقاعدة بيانات PostgreSQL (عبر Supabase Self-Hosted).

## المتطلبات المسبقة

1.  **سيرفر VPS**: (DigitalOcean, Hetzner, Linode, إلخ) بنظام Ubuntu 22.04 LTS ومواصفات لا تقل عن 2GB RAM.
2.  **اسم نطاق (Domain)**: (اختياري لكن مفضل) موجه إلى IP السيرفر.
3.  **برنامج SSH**: للوصول للسيرفر (Terminal, PuTTY).

---

## الخطوة 1: إعداد السيرفر (VPS)

قم بتسجيل الدخول إلى السيرفر:
```bash
ssh root@YOUR_SERVER_IP
```

### تحديث النظام وتثبيت الأدوات الأساسية
```bash
apt update && apt upgrade -y
apt install curl git unzip -y
```

### تثبيت Docker & Docker Compose
نحتاج Docker لتشغيل قاعدة البيانات (Supabase/Postgres) بسهولة.
```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
apt install docker-compose-plugin -y
```

---

## الخطوة 2: إعداد قاعدة البيانات (Supabase Self-Hosted)

سنقوم بتشغيل نسخة محلية من Supabase على السيرفر لضمان توافق النظام.

1.  **إنشاء مجلد للنظام:**
    ```bash
    mkdir -p /opt/moonlight-db
    cd /opt/moonlight-db
    ```

2.  **تحميل إعدادات Docker:**
    ```bash
    git clone --depth 1 https://github.com/supabase/supabase
    cd supabase/docker
    ```

3.  **ضبط المتغيرات:**
    ```bash
    cp .env.example .env
    nano .env
    ```
    *   قم بتغيير `POSTGRES_PASSWORD` إلى كلمة مرور قوية.
    *   قم بتغيير `JWT_SECRET` إلى نص عشوائي طويل وآمن.
    *   (اختياري) عدل `API_EXTERNAL_URL` ليكون `http://YOUR_SERVER_IP:8000`.

4.  **تشغيل الخدمات:**
    ```bash
    docker compose up -d
    ```
    *   انتظر قليلاً حتى تعمل الحاويات. لوحة التحكم ستكون متاحة على المنفذ `8000` (أو `3000` حسب النسخة).

5.  **تهيئة قاعدة البيانات (Migration):**
    *   افتح المتصفح وادخل: `http://YOUR_SERVER_IP:8000` (أو المنفذ المحدد في `.env`).
    *   اذهب إلى **SQL Editor**.
    *   انسخ محتوى الملف `db/schema.sql` الموجود في كود المشروع.
    *   الصقه في المحرر ونفذه (Run) لإنشاء الجداول.

---

## الخطوة 3: إعداد الواجهة الأمامية (Frontend)

سنستخدم **Nginx** لتقديم ملفات التطبيق.

### تثبيت Nginx
```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### بناء المشروع (Build)
قم بهذه الخطوة **على جهازك الشخصي** أو بيئة التطوير الخاصة بك:

1.  **إنشاء ملف بيئة الإنتاج:**
    أنشئ ملف `.env.production` في المجلد الرئيسي للمشروع:
    ```env
    VITE_SUPABASE_URL=http://YOUR_SERVER_IP:8000
    VITE_SUPABASE_ANON_KEY=نسخ_المفتاح_من_لوحة_تحكم_Supabase_أو_ملف_docker_env
    ```

2.  **بناء الملفات:**
    ```bash
    npm run build
    ```
    *   سينتج مجلد اسمه `dist`.

3.  **رفع الملفات للسيرفر:**
    استخدم `scp` من جهازك لرفع مجلد `dist`:
    ```bash
    scp -r dist/* root@YOUR_SERVER_IP:/var/www/html/
    ```

---

## الخطوة 4: ضبط Nginx (توجيه الصفحات)

لحل مشكلة تحديث الصفحة في تطبيقات React (SPA):

1.  **تعديل الإعدادات:**
    ```bash
    nano /etc/nginx/sites-available/default
    ```

2.  **استبدال المحتوى بالتالي:**
    ```nginx
    server {
        listen 80;
        server_name YOUR_DOMAIN_OR_IP;

        root /var/www/html;
        index index.html;

        # توجيه جميع الطلبات إلى index.html لدعم React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # تخزين مؤقت للملفات الثابتة (اختياري للسرعة)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }
    ```

3.  **إعادة تشغيل Nginx:**
    ```bash
    nginx -t  # فحص الأخطاء
    systemctl restart nginx
    ```

---

## الخطوة 5: الأمان (SSL & Firewall)

1.  **تفعيل جدار الحماية (UFW):**
    ```bash
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw allow 8000 # للسماح بالوصول لـ Supabase API (يمكن تقييده لاحقاً)
    ufw enable
    ```

2.  **تشفير الاتصال (SSL) - إذا كان لديك دومين:**
    ```bash
    apt install certbot python3-certbot-nginx -y
    certbot --nginx -d yourdomain.com
    ```

---

## الخطوة 6: التشغيل النهائي

الآن يمكنك الدخول إلى النظام عبر المتصفح:
`http://YOUR_SERVER_IP`

سيقوم النظام بالاتصال بقاعدة البيانات المحلية على السيرفر، وسيتم حفظ جميع البيانات (الفواتير، العملاء، المخزون) بشكل دائم وآمن.
