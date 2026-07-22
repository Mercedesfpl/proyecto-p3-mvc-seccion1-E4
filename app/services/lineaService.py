from app.repositories.lineaRepository import LineaRepository
from app.services.linea_factory import LineaFactory
from app.models.persona import Persona
from app.models.models import Usuario
from app.models.exceptions import ResourceNotValid, ResourceNotFound
from app.repositories.personaRepository import PersonaRepository
from app.repositories.userRepository import UserRepository

class LineaServices: 
    #Contiene lógica de negocios para líneas

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
                    "rif": l.rif
                }
                for l in lineas
            ]
        except Exception as e:
            print ("Error en get_all_lineas", e)
            raise

    @staticmethod 
    def get_linea_by_id(id_linea):
        #Obtiene una línea por ID
        linea = LineaRepository.get_by_id(id_linea)
        if not linea or linea.suspendido:
            raise ResourceNotFound("Línea")
        return linea.to_dict()
    
    @staticmethod 
    def get_personas_disponibles():
        #obtiene todas las personas para los selects
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
        #obtiene todos los usuarios del rol secretario
        secretarios = PersonaRepository.get_secretarios()
        return [
            {
                "id": s.id,
                "nombre": s.nombre,
                "apellido": s.apellido
            }
            for s in secretarios
        ]
    
    @staticmethod 
    def create_linea(data):
        #Crea una nueva línea usando la fábrica
        
        # Validaciones de negocio
        if not data.get('nombre'):
            raise ResourceNotValid("Línea", "El nombre es obligatorio")
        if not data.get('rif'):
            raise ResourceNotValid("Línea", "El RIF es obligatorio")
        if not data.get('presidente_id'):
            raise ResourceNotValid("Línea", "Debes seleccionar un presidente")
        
        #Verificar que no exista otra línea con el mismo nombre
        if LineaRepository.existentePorNombre(data['nombre']):
            raise ResourceNotValid("Línea", "Ya existe una línea con ese nombre")
        
        #Verificar que el presidente exista
        presidente = UserRepository.get_by_id(data['presidente_id'])
        if not presidente:
            raise ResourceNotFound("Presidente no encontrado")
        
        #Verificar que el secretario exista (si se selecciono)
        secretario = UserRepository.get_by_id(data['secretario_id'])
        if not secretario:
            raise ResourceNotFound("Secretario no encontrado")

        #Usar la fábrica para crear un objeto
        nueva_linea = LineaFactory.crear_linea(data)

        #Guardar en la bd
        return LineaRepository.save(nueva_linea)
    
    @staticmethod 
    def update_linea(data, id_linea):
        #Actualiza una línea existente
        
        # Validaciones de negocio
        linea = LineaRepository.get_by_id(id_linea)
        if not linea or linea.suspendido:
            raise ResourceNotFound("Línea")
        
        #Actualizar campos con validaciones
        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if LineaRepository.existentePorNombre(nombre, exclude_id=id_linea):
                raise ResourceNotValid("Línea", "Ya existe otra línea con ese nombre")
            linea.nombre = nombre

        if 'rif' in data:
            linea.rif = data['rif'].strip()

        if 'presidente_id' in data:
            presidente = UserRepository.get_by_id(data['presidente_id'])
            if not presidente: 
                raise ResourceNotFound("Presidente")
            linea.presidente_id = data['presidente_id']

        if 'secretario_id' in data: 
            secretario = UserRepository.get_by_id(data['secretario_id'])
            if not secretario: 
                raise ResourceNotFound("Secretario")
            linea.secretario_id = data['secretario_id']
        
        return LineaRepository.update(linea)
        
    @staticmethod 
    def delete_linea(id_linea):
        #"Elimina" (Suspende) una línea existente
        
        linea = LineaRepository.get_by_id(id_linea)
        if not linea:
            raise ResourceNotFound("Línea")
        return LineaRepository.delete(linea)