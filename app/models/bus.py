from app.extensions import db

class Bus(db.Model):
    __tablename__ = 'buses'
    
    id_vehiculo = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(10), nullable=False, unique=True)
    id_linea = db.Column(db.Integer, db.ForeignKey('lineas.id'), nullable=False)
    id_ruta = db.Column(db.Integer, db.ForeignKey('rutas.id'), nullable=True)
    id_secretario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    status = db.Column(db.String(10), default='activa')
    
    # Relaciones
    linea = db.relationship('Linea', backref='buses')
    ruta = db.relationship('Ruta', backref='buses')
    secretario = db.relationship('Usuario', foreign_keys=[id_secretario])
    
    def to_dict(self):
        return {
            "id_vehiculo": self.id_vehiculo,
            "placa": self.placa,
            "id_linea": self.id_linea,
            "id_ruta": self.id_ruta,
            "id_secretario": self.id_secretario,
            "status": self.status
        }