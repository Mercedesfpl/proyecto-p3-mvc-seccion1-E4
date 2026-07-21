Título:
Retroalimentación Evaluación 2 - Arquitectura y MVC

Contenido:
Equipo E4 - Evaluación 2

Calificación: 7/20

Desglose:
- Análisis del sistema actual: 0.5/6
- Diseño propuesto MVC: 2.5/4
- Implementación MVC: 3/6
- Uso de Git: 0.8/2
- README: 0/2

Fortalezas:
Se observa una intención de aplicar una estructura organizada en Flask, separando archivos de rutas, controladores, modelos, configuración y extensiones. También se evidencia una implementación parcial del módulo de autenticación, incluyendo login, logout y registro de usuarios.

El uso de blueprints, SQLAlchemy, Flask-Login y JWT muestra una aproximación técnica interesante para un proyecto sencillo, y la existencia de archivos como run.py, app/__init__.py, app/routes/auth.py, app/controllers/userControllers.py y app/models/models.py permite identificar una base funcional orientada a capas.

Aspectos a mejorar:
El repositorio no está preparado como entrega final. El branch principal main no contiene una entrega clara y el código revisable se encuentra en una rama secundaria. Para una evaluación mediante repositorio, la versión final debe estar en main o el README debe indicar claramente qué rama revisar.

El README está vacío. Esto afecta fuertemente la calificación, ya que la evaluación solicitaba obligatoriamente descripción del proyecto, diagnóstico inicial, arquitectura MVC, cambios realizados, evidencia en Git y cómo ejecutar el proyecto.

No se evidencia un análisis del sistema actual. La evaluación pedía explicar qué estaba mal o cómo estaba organizado el sistema antes de aplicar MVC. Ese diagnóstico no aparece documentado.

La implementación MVC es parcial. Aunque existen rutas, controlador y modelo, el controlador concentra demasiadas responsabilidades: validación, consulta a base de datos, generación de tokens, manejo de sesión y construcción de la respuesta. Se recomienda separar mejor lógica de negocio, validaciones y acceso a datos.

También debe revisarse la validación de contraseña, ya que el método formatPass parece retornar True cuando la contraseña cumple el formato, pero el controlador lanza error cuando retorna True.

Recomendación:
Consolidar la entrega en main, completar el README, documentar el diagnóstico inicial y mejorar la separación de responsabilidades dentro del módulo de autenticación.
