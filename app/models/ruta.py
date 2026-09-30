# app/models/ruta.py

from app.extensions import db


class Ruta(db.Model):
    __tablename__ = 'rutas'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(10), default='activa')
    id_linea = db.Column(db.Integer, db.ForeignKey('lineas.id'), nullable=False)

    linea = db.relationship('Linea', backref='rutas')

    def to_dict(self):
        paradas_list = []
        for rp in self.ruta_paradas:
            parada = rp.parada
            if parada:
                paradas_list.append({
                    "id": parada.id,
                    "nombre": parada.nombre,
                    "coordenadas": parada.coordenadas,
                    "orden": rp.orden_parada,
                })

        return {
            # Formato nuevo (compatible)
            "id_ruta": self.id,
            "id": self.id,  
            "nombre": self.nombre,
            "status": self.status,
            "id_linea": self.id_linea,
            "linea": (
                {"id": self.linea.id, "nombre": self.linea.nombre}
                if self.linea else None
            ),
            "linea_nombre": self.linea.nombre if self.linea else None,
            "color": self.linea.color if self.linea else "#74A9D3",  
            "paradas": paradas_list,
            "total_paradas": len(paradas_list),
        }