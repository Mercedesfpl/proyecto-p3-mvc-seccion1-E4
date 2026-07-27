# app/models/ruta.py

from app.extensions import db

class Ruta(db.Model):
    __tablename__ = 'rutas'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(10), default='activa')
    id_linea = db.Column(db.Integer, db.ForeignKey('lineas.id'), nullable=False)
    
    # Relaciones
    linea = db.relationship('Linea', backref='rutas')
    
    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "status": self.status,
            "id_linea": self.id_linea,
            "linea_nombre": self.linea.nombre if self.linea else None,
            "paradas": []
        }