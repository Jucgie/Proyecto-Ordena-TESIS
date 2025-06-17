from django.db import models

# Create your models here.

class BodegaCentral(models.Model):
    id_bdg = models.BigAutoField(primary_key=True)
    nombre_bdg = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    rut = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'bodega_central'
        managed = False

class Categoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=255, null=True)
    descripcion = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = 'categoria'
        managed = False

    def __str__(self):
        return self.nombre or ''

class Marca(models.Model):
    id_mprod = models.BigAutoField(primary_key=True)
    nombre_mprod = models.CharField(max_length=255)
    descripcion_mprod = models.TextField()

    class Meta:
        db_table = 'marca'
        managed = False

    def __str__(self):
        return self.nombre_mprod

class Sucursal(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre_sucursal = models.CharField(max_length=255, null=True)
    direccion = models.CharField(max_length=255, null=True)
    descripcion = models.CharField(max_length=255, null=True)
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE, db_column='bodega_fk')
    rut = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'sucursal'
        managed = False

class Rol(models.Model):
    id_rol = models.BigAutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=255)

    class Meta:
        db_table = 'rol'
        managed = False

class Usuario(models.Model):
    id_us = models.BigAutoField(primary_key=True)
    rut = models.CharField(max_length=255, null=True)
    nombre = models.CharField(max_length=255)
    correo = models.CharField(max_length=255)
    contrasena = models.CharField(max_length=255)
    bodeg_fk = models.ForeignKey(BodegaCentral, on_delete=models.SET_NULL, null=True, db_column='bodeg_fk')
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True, db_column='sucursal_fk')
    rol_fk = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='rol_fk')

    class Meta:
        db_table = 'usuario'
        managed = False

class Productos(models.Model):
    id_prodc = models.BigAutoField(primary_key=True)
    nombre_prodc = models.CharField(max_length=255)
    descripcion_prodc = models.CharField(max_length=255, null=True)
    codigo_interno = models.CharField(max_length=255)
    fecha_creacion = models.DateTimeField()
    marca_fk = models.ForeignKey(Marca, on_delete=models.CASCADE, db_column='marca_fk')
    categoria_fk = models.ForeignKey(Categoria, on_delete=models.CASCADE, db_column='categoria_fk')
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE, db_column='bodega_fk', null=True)
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.CASCADE, db_column='sucursal_fk', null=True)

    class Meta:
        db_table = 'productos'
        managed = False

    def __str__(self):
        return f"{self.nombre_prodc} - {self.codigo_interno}"

class Proveedor(models.Model):
    id_provd = models.BigAutoField(primary_key=True)
    nombres_provd = models.CharField(max_length=255)
    direccion_provd = models.CharField(max_length=255)
    correo = models.CharField(max_length=255)
    razon_social = models.CharField(max_length=255)
    rut_empresa = models.DecimalField(max_digits=20, decimal_places=0, null=True)

    class Meta:
        db_table = 'proveedor'
        managed = False

class EstadoPedido(models.Model):
    id_estped = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = 'estado_pedido'
        managed = False

class PersonalEntrega(models.Model):
    id_psn = models.BigAutoField(primary_key=True)
    nombre_psn = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)
    patente = models.CharField(max_length=255)

    class Meta:
        db_table = 'personal_entrega'
        managed = False

class Solicitudes(models.Model):
    id_solc = models.BigAutoField(primary_key=True)
    fecha_creacion = models.DateTimeField()
    observacion = models.CharField(max_length=1)
    fk_sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    fk_bodega = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE)
    usuarios_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    class Meta:
        db_table = 'solicitudes'
        managed = False

class Pedidos(models.Model):
    id_p = models.BigAutoField(primary_key=True)
    descripcion = models.CharField(max_length=255)
    fecha_entrega = models.DateTimeField()
    estado_pedido_fk = models.ForeignKey(EstadoPedido, on_delete=models.CASCADE)
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True)
    personal_entrega_fk = models.ForeignKey(PersonalEntrega, on_delete=models.CASCADE)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    solicitud_fk = models.ForeignKey(Solicitudes, on_delete=models.CASCADE)
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE)
    proveedor_fk = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'pedidos'
        managed = False

class DetallePedido(models.Model):
    id = models.BigAutoField(primary_key=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.CharField(max_length=255, null=True)
    productos_pedido_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE)

    class Meta:
        db_table = 'detalle_pedido'
        managed = False

class Stock(models.Model):
    id_stock = models.BigAutoField(primary_key=True)
    stock = models.DecimalField(max_digits=10, decimal_places=2)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.SET_NULL, null=True)
    productos_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True)
    proveedor_fk = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'stock'
        managed = False

class MovInventario(models.Model):
    id_mvin = models.BigAutoField(primary_key=True)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField()
    productos_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    class Meta:
        db_table = 'mov_inventario'
        managed = False

class Notificacion(models.Model):
    id_ntf = models.BigAutoField(primary_key=True)
    nombre_ntf = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    pedido_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE)
    fecha_hora_ntd = models.DateTimeField()

    class Meta:
        db_table = 'notificacion'
        managed = False

class Historial(models.Model):
    id_hst = models.BigAutoField(primary_key=True)
    fecha = models.DateTimeField()
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE)
    producto_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)

    class Meta:
        db_table = 'historial'
        managed = False

class Modulos(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)

    class Meta:
        db_table = 'modulos'
        managed = False

class Permisos(models.Model):
    id = models.BigAutoField(primary_key=True)
    modulo_fk = models.ForeignKey(Modulos, on_delete=models.CASCADE)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    rol_fk = models.ForeignKey(Rol, on_delete=models.CASCADE)

    class Meta:
        db_table = 'permisos'
        managed = False

class Informe(models.Model):
    id_informe = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=255, null=True)
    descripcion = models.CharField(max_length=255, null=True)
    modulo_origen = models.CharField(max_length=255, null=True)
    contenido = models.CharField(max_length=255, null=True)
    archivo_url = models.CharField(max_length=255, null=True)
    fecha_generado = models.DateTimeField(null=True)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.SET_NULL, null=True)
    productos_fk = models.ForeignKey(Productos, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'informe'
        managed = False
