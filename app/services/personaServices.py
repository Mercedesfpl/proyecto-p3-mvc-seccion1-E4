from app.repositories.personaRepository import PersonaRepository
from app.services.persona_factory import PersonaFactory
from app.models.exceptions import ResourceNotFound, ResourceNotValid
from app.extensions import db
import re

class PersonaServices:
    #Contiene la lógica de nogocios para Personas

    @staticmethod
    def validar_cedula(cedula):
        #Valida que la cédula solo contenga números
        if not cedula.isdigit():
            raise ResourceNotValid("Persona", "La cédula solo debe contener números")
        return cedula
    
    @staticmethod
    def validar_correo(correo):
        #Valida el correo electrónico
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', correo):
            raise ResourceNotValid("Persona", "Formato de correo inválido")
        return correo
    
    @staticmethod
    def validar_rol(rol):
        #Valida que el rol sea valido
        roles_validos = ["admin", "presidente", "secretario", "usuario"]
        if rol and rol not in roles_validos:
            raise ResourceNotValid("Persona", f"Rol inválido: {rol}")
        return rol
    
    @staticmethod
    def get_all_personas():
        #Obtiene todas las personas
        personas = PersonaRepository.get_all()
        return [p.to_dict() for p in personas]
    
    @staticmethod
    def get_persona_by_id(id_persona):
        #Obtiene una persona por id
        persona = PersonaRepository.get_by_id(id_persona)
        if not persona:
            raise ResourceNotFound("Persona")
        return persona.to_dict()
    
    @staticmethod
    def get_persona_select_presidente():
        #Obtiene persona con rol 'presidente' para selectores
        presidentes = PersonaRepository.get_presidente()
        return [{
            "id":p.id, "nombre_completo": f"{p.nombre} {p.apellido}", "cedula": p.cedula 
        } for p in presidentes]
    
    @staticmethod
    def get_persona_select_secretario():
        #Obtiene persona con rol 'presidente' para selectores
        secretarios = PersonaRepository.get_secretarios()
        return [{
            "id":s.id, "nombre":s.nombre , "email": s.email 
        } for s in secretarios]
    
    @staticmethod
    def create_persona(data):
        #Crea una nueva persona y su usuario asociado

        # Validaciones de negocio
        if not data.get('nombre') or not data.get('apellido') or not data.get('cedula'):
            raise ResourceNotValid("Persona", "Nombre, apellido y cédula son obligatorios")

        cedula = PersonaServices.validar_cedula(data['cedula'])
        if PersonaRepository.existePorCedula(cedula):
            raise ResourceNotValid("Persona", "Ya existe una persona con esa cédula")

        correo = data.get('correo', '').strip()
        if correo:
            PersonaServices.validar_correo(correo)
            if PersonaRepository.existePorCedula(correo):
                raise ResourceNotValid("Persona", "Ya existe una persona con ese correo")

        if data.get('rol'):
            PersonaServices.validar_rol(data['rol'])

        # Crear persona usando Factory
        persona = PersonaFactory.crear_persona(data)
        persona_saved = PersonaRepository.save(persona)

        # Crear usuario asociado (SIEMPRE)
        usuario = PersonaFactory.crear_usuario(persona_saved)
        db.session.add(usuario)
        db.session.commit()

        return {
            "persona": persona_saved.to_dict(),
            "usuario": {
                "id": usuario.id,
                "email": usuario.email,
                "rol": usuario.rol
            }
        }
    
    @staticmethod
    def update_persona(id_persona, data):
        #Actualiza a una persona existente

        persona = PersonaRepository.get_by_id(id_persona)
        if not persona:
            raise ResourceNotFound("Persona")
        
        #Actualizar campos con validaciones

        if 'nombre' in data:
            persona.nombre = data['nombre'].strip()

        if 'apellido' in data: 
            persona.apellido= data['apellido'].strip()

        if 'cedula' in data: 
            cedula = data['cedula'].strip()
            if not cedula.isdigit():
                raise ResourceNotValid("Persona", "La cédula debe contener números")
            cedula = PersonaServices.validar_cedula(data['cedula'])
            if PersonaRepository.existePorCedula(cedula, exclude_id=id_persona):
                raise ResourceNotValid("Persona", "Ya existe otra persona con esa cédula")
            persona.cedula=cedula

        if 'correo' in data:
            correo = data['correo'].strip()
            if correo:
                PersonaServices.validar_correo(correo)
                if PersonaRepository.existePorCorreo(correo, exclude_id=id_persona):
                    raise ResourceNotValid("Persona", "Ya existe otra persona con ese correo")
            persona.correo = correo

        if 'telefono' in data: 
            persona.telefono = data['telefono'].strip()

        if 'rol' in data:
            rol = PersonaServices.validar_rol(data['rol'])
            persona.rol = rol
            #Actualizar también el rol del usuario asociado
            usuario = PersonaRepository.get_usuario_by_persona(persona.id)
            if usuario:
                if persona.rol in ["admin", "secretario"]:
                    usuario.rol = persona.rol
                else:
                    usuario.rol = "usuario"
        resultado = PersonaRepository.save(persona)
        return resultado

    @staticmethod
    def delete_persona(id_persona):
        #Elimina una persona (con verificación de dependencias)
        persona = PersonaRepository.get_by_id(id_persona)
        if not persona:
            raise ResourceNotFound("Persona")

        # Verificar si es presidente de alguna línea
        if PersonaRepository.is_presidente_en_linea(id_persona):
            raise ResourceNotValid("Persona", "No se puede eliminar porque es presidente de una línea")

        # Eliminar usuario asociado si existe
        usuario = PersonaRepository.get_usuario_by_persona(persona.id)
        if usuario:
            db.session.delete(usuario)

        return PersonaRepository.delete(persona)