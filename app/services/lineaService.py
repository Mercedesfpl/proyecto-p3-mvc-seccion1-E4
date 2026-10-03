from app.repositories.lineaRepository import LineaRepository
from app.factory.linea_factory import LineaFactory
from app.models.persona import Persona
from app.models.models import Usuario
from app.models.exceptions import ResourceNotValid, ResourceNotFound
from app.repositories.personaRepository import PersonaRepository
from app.repositories.userRepository import UserRepository


class LineaServices:
    # Contiene lógica de negocios para líneas

    @staticmethod
    def get_all_lineas():
        try:
            lineas = LineaRepository.get_all()
            return [
                {
                    "id": l.id,
                    "nombre": l.nombre,
                    "presidente": l.presidente.nombre if l.presidente else None,
                    "secretario_nombre": l.secretario.nombre if l.secretario else None,
                    "rif": l.rif,
                    "color": l.color or "#74A9D3",            
                    "suspendido": l.suspendido,                
                    "presidente_id": l.presidente_id,          
                    "secretario_id": l.secretario_id,         
                }
                for l in lineas
            ]
        except Exception as e:
            print("Error en get_all_lineas", e)
            raise

    @staticmethod
    def get_linea_by_id(id_linea):
        # Obtiene una línea por ID
        linea = LineaRepository.get_by_id(id_linea)
        if not linea or linea.suspendido:
            raise ResourceNotFound("Línea")
        return linea.to_dict()

    @staticmethod
    def get_personas_disponibles():
        # obtiene todas las personas para los selects
        personas = PersonaRepository.get_all()
        if not personas:
            raise ResourceNotFound("Personas")
        return [
            {
                "id": p.id,
                "nombre": p.nombre,
                "cedula": p.cedula,
                "rol": p.rol,
            }
            for p in personas
        ]

    @staticmethod
    def get_secretarios_disponibles():
        # obtiene todos los usuarios del rol secretario
        secretarios = PersonaRepository.get_secretarios()
        return [
            {
                "id": s.id,
                "nombre": s.nombre,
                "rol": s.rol,
                # "apellido": s.apellido
            }
            for s in secretarios
        ]


    @staticmethod
    def create_linea(data):
        if not data.get("nombre"):
            raise ResourceNotValid("Línea", "El nombre es obligatorio")
        if not data.get("rif"):
            raise ResourceNotValid("Línea", "El RIF es obligatorio")
        if not data.get("presidente_id"):
            raise ResourceNotValid("Línea", "Debes seleccionar un presidente")

        if LineaRepository.existentePorNombre(data["nombre"]):
            raise ResourceNotValid("Línea", "Ya existe una línea con ese nombre")

        # El presidente es una Persona, no un Usuario
        presidente = PersonaRepository.get_by_id(data["presidente_id"])
        if not presidente:
            raise ResourceNotFound("Presidente no encontrado")

        secretario_id = data.get("secretario_id")
        if secretario_id:
            secretario = UserRepository.get_by_id(secretario_id)
            if not secretario:
                raise ResourceNotFound("Secretario no encontrado")

        nueva_linea = LineaFactory.crear_linea(data)

        if secretario_id:
            nueva_linea.secretario_id = secretario_id

        return LineaRepository.save(nueva_linea)


    @staticmethod
    def update_linea(id_linea, data):
        try:
            id_linea = int(id_linea)
        except (TypeError, ValueError):
            raise ResourceNotValid("Línea", "ID no válido")

        linea = LineaRepository.get_by_id(id_linea)
        if not linea or linea.suspendido:
            raise ResourceNotFound("Línea")

        if "nombre" in data:
            nombre = data["nombre"].strip()
            if LineaRepository.existentePorNombre(nombre, exclude_id=id_linea):
                raise ResourceNotValid("Línea", "Ya existe otra línea con ese nombre")
            linea.nombre = nombre

        if "rif" in data:
            linea.rif = data["rif"].strip()

        if "presidente_id" in data:
            presidente = PersonaRepository.get_by_id(data["presidente_id"]) 
            if not presidente:
                raise ResourceNotFound("Presidente")
            linea.presidente_id = data["presidente_id"]

        if "secretario_id" in data:
            secretario_id = data["secretario_id"]
            if secretario_id:
                secretario = UserRepository.get_by_id(secretario_id)
                if not secretario:
                    raise ResourceNotFound("Secretario")
                linea.secretario_id = secretario_id
            else:
                linea.secretario_id = None

        if "color" in data and data["color"]:
            linea.color = data["color"]

        return LineaRepository.update(linea)

    @staticmethod
    def delete_linea(id_linea):
        # "Elimina" (Suspende) una línea existente

        linea = LineaRepository.get_by_id(id_linea)
        if not linea:
            raise ResourceNotFound("Línea")
        return LineaRepository.delete(linea)
