from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# Create your models here.

class BodegaCentral(models.Model):
    id_bdg = models.BigAutoField(primary_key=True)
    nombre_bdg = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    rut = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'bodega_central'
        managed = False

    @property
    def id(self):
        return self.id_bdg

class Categoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=255, null=True)
    descripcion = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = 'categoria'
        managed = False

    def __str__(self):
        return self.nombre

    @property
    def id(self):
        return self.id

class Marca(models.Model):
    id_mprod = models.BigAutoField(primary_key=True)
    nombre_mprod = models.CharField(max_length=255)
    descripcion_mprod = models.CharField(max_length=255)

    class Meta:
        db_table = 'marca'
        managed = False

    def __str__(self):
        return self.nombre_mprod

    @property
    def id(self):
        return self.id_mprod

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

    @property
    def id(self):
        return self.id_rol

class UsuarioManager(BaseUserManager):
    def create_user(self, correo, contrasena=None, **extra_fields):
        if not correo:
            raise ValueError('El correo es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(contrasena)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, contrasena, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo, contrasena, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    id_us = models.BigAutoField(primary_key=True)
    rut = models.CharField(max_length=255, null=True)
    nombre = models.CharField(max_length=255)
    correo = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=255)
    contrasena_old = models.CharField(max_length=255, null=True)
    bodeg_fk = models.ForeignKey(BodegaCentral, on_delete=models.SET_NULL, null=True, db_column='bodeg_fk')
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True, db_column='sucursal_fk')
    rol_fk = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='rol_fk')
    
    # Campos requeridos por Django Auth
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre']

    class Meta:
        db_table = 'usuario'
        managed = False

    def get_full_name(self):
        return self.nombre

    def get_short_name(self):
        return self.nombre

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def id(self):
        return self.id_us

    @property
    def password(self):
        return self.contrasena

    @password.setter
    def password(self, value):
        self.contrasena = value

class Productos(models.Model):
    id_prodc = models.BigAutoField(primary_key=True)
    nombre_prodc = models.CharField(max_length=255)
    descripcion_prodc = models.CharField(max_length=255, null=True)
    codigo_interno = models.CharField(max_length=255)
    fecha_creacion = models.DateTimeField()
    marca_fk = models.ForeignKey(Marca, on_delete=models.CASCADE, db_column='marca_fk')
    categoria_fk = models.ForeignKey(Categoria, on_delete=models.CASCADE, db_column='categoria_fk')
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE, null=True, db_column='bodega_fk')
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.CASCADE, null=True, db_column='sucursal_fk')

    class Meta:
        db_table = 'productos'
        managed = False

    def __str__(self):
        return self.nombre_prodc

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

    @property
    def id(self):
        return self.id_provd

class EstadoPedido(models.Model):
    id_estped = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = 'estado_pedido'
        managed = False

    @property
    def id(self):
        return self.id_estped

class PersonalEntrega(models.Model):
    id_psn = models.BigAutoField(primary_key=True)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_fk')
    nombre_psn = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)
    patente = models.CharField(max_length=255)

    class Meta:
        db_table = 'personal_entrega'
        managed = True

    @property
    def id(self):
        return self.id_psn

    def __str__(self):
        return f"{self.usuario_fk.nombre} - {self.patente}"

class Solicitudes(models.Model):
    id_solc = models.BigAutoField(primary_key=True)
    fecha_creacion = models.DateTimeField()
    fk_sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, db_column='fk_sucursal')
    fk_bodega = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE, db_column='fk_bodega')
    usuarios_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuarios_fk')
    estado = models.CharField(max_length=20, null=True)
    despachada = models.BooleanField(null=True)
    observacion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'solicitudes'
        managed = False

    @property
    def id(self):
        return self.id_solc

class SolicitudProductos(models.Model):
    id_solc_prod = models.BigAutoField(primary_key=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    solicitud_fk = models.ForeignKey(Solicitudes, on_delete=models.CASCADE, related_name='productos', db_column='solicitud_fk')
    producto_fk = models.ForeignKey(Productos, on_delete=models.CASCADE, db_column='producto_fk_id')

    class Meta:
        db_table = 'solicitud_productos'
        managed = False

    @property
    def id(self):
        return self.id_solc_prod

class Pedidos(models.Model):
    id_p = models.BigAutoField(primary_key=True)
    descripcion = models.CharField(max_length=255)
    fecha_entrega = models.DateTimeField()
    estado_pedido_fk = models.ForeignKey(EstadoPedido, on_delete=models.CASCADE)
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True)
    personal_entrega_fk = models.ForeignKey(PersonalEntrega, on_delete=models.CASCADE)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    solicitud_fk = models.ForeignKey(Solicitudes, on_delete=models.CASCADE, db_column='solicitud_fk')
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.CASCADE)
    proveedor_fk = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'pedidos'
        managed = False

    @property
    def id(self):
        return self.id_p

class DetallePedido(models.Model):
    id = models.BigAutoField(primary_key=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.CharField(max_length=255, null=True)
    productos_pedido_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE, related_name='detalles_pedido')

    class Meta:
        db_table = 'detalle_pedido'
        managed = False

class Stock(models.Model):
    id_stock = models.BigAutoField(primary_key=True)
    stock = models.DecimalField(max_digits=10, decimal_places=2)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    bodega_fk = models.IntegerField(null=True, db_column='bodega_fk')
    productos_fk = models.ForeignKey('Productos', on_delete=models.CASCADE, db_column='productos_fk')
    sucursal_fk = models.IntegerField(null=True, db_column='sucursal_fk')
    proveedor_fk = models.IntegerField(null=True, db_column='proveedor_fk')

    class Meta:
        db_table = 'stock'
        managed = False

    @property
    def id(self):
        return self.id_stock

class MovInventario(models.Model):
    id_mvin = models.BigAutoField(primary_key=True)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField()
    productos_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_fk')

    class Meta:
        db_table = 'mov_inventario'
        managed = False

    @property
    def id(self):
        return self.id_mvin

class Notificacion(models.Model):
    id_ntf = models.BigAutoField(primary_key=True)
    nombre_ntf = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    pedido_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE, db_column='pedido_fk')
    fecha_hora_ntd = models.DateTimeField()

    class Meta:
        db_table = 'notificacion'
        managed = False

    @property
    def id(self):
        return self.id_ntf

class Historial(models.Model):
    id_hst = models.BigAutoField(primary_key=True)
    fecha = models.DateTimeField()
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_fk')
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE, db_column='pedidos_fk')
    producto_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)

    class Meta:
        db_table = 'historial'
        managed = False

    @property
    def id(self):
        return self.id_hst

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
    contenido = models.TextField(null=True)
    archivo_url = models.CharField(max_length=255, null=True)
    fecha_generado = models.DateTimeField(null=True)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, db_column='usuario_fk')
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.SET_NULL, null=True, db_column='pedidos_fk')
    productos_fk = models.ForeignKey(Productos, on_delete=models.SET_NULL, null=True, db_column='productos_fk_id')
    bodega_fk = models.ForeignKey(BodegaCentral, on_delete=models.SET_NULL, null=True, db_column='bodega_fk')
    sucursal_fk = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True, db_column='sucursal_fk')
    
    class Meta:
        db_table = 'informe'
        managed = False

    @property
    def id(self):
        return self.id_informe
