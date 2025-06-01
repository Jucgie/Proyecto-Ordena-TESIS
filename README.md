# 🧾 Ordena

**Ordena** es una plataforma web de gestión de inventario y pedidos diseñada para una cadena de ferreterías. Permite la administración eficiente del stock entre la bodega central y las sucursales, con control por roles, flujo de solicitudes, y un dashboard centralizado.

---

## 🚀 Tecnologías utilizadas

### 🖥️ Frontend
- ⚛️ [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- 🎨 [Material UI (MUI)](https://mui.com/) para la interfaz
- 🔁 [Axios](https://axios-http.com/) para las peticiones HTTP

### 🔧 Backend
- 🐍 [Django](https://www.djangoproject.com/) + [Django REST Framework](https://www.django-rest-framework.org/)
- 🛡️ Autenticación por tokens (JWT o sesión)
- 🗃️ Base de datos (PostgreSQL

---

## 🧩 Estructura del proyecto

ordena/
├── frontend/ # Cliente web en React + Vite
│ ├── src/
│ └── ...
├── backend/ # API REST en Django
│ ├── ordena_api/
│ ├── manage.py
│ └── ...
├── README.md
└── .gitignore


---

## ⚙️ Instalación y ejecución

### 🔷 Clonar el repositorio

git clone https://github.com/tu-usuario/ordena.git
cd ordena

🖥️ Frontend (React + Vite)

cd frontend
deno install
deno run dev

Abre http://localhost:5173 en el navegador para ver la app.


🔧 Backend (Django)

cd backend
python -m venv env
source env/bin/activate  # En Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Accede al backend en http://localhost:8000
