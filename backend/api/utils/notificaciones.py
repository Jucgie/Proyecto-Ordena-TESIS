

def crear_notificacion(
    usuario, 
    nombre, 
    descripcion, 
    tipo="info", 
    pedido=None, 
    producto=None, 
    link=None
):
    from api.models import Notificacion
    return Notificacion.objects.create(
        usuario_fk=usuario,
        nombre_ntf=nombre,
        descripcion=descripcion,
        tipo=tipo,
        pedido_fk=pedido,
        producto_fk=producto,
        link=link
    ) 