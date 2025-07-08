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
    codigo_interno = models.CharField(max_length=255, unique=True)
    fecha_creacion = models.DateTimeField()
    activo = models.BooleanField(default=True)
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
    descripcion_psn = models.CharField(max_length=255)
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
    stock_maximo = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    bodega_fk = models.IntegerField(null=True, db_column='bodega_fk')
    productos_fk = models.ForeignKey('Productos', on_delete=models.RESTRICT, db_column='productos_fk')
    sucursal_fk = models.IntegerField(null=True, db_column='sucursal_fk')
    proveedor_fk = models.IntegerField(null=True, db_column='proveedor_fk')

    class Meta:
        db_table = 'stock'
        managed = False

    @property
    def id(self):
        return self.id_stock

    def save(self, *args, **kwargs):
        from api.utils.notificaciones import crear_notificacion  # Importación local para evitar circularidad
        from api.models import Usuario, BodegaCentral, Sucursal, Productos, Notificacion
        # Obtener valores anteriores
        if self.pk:
            try:
                prev = Stock.objects.get(pk=self.pk)
                prev_stock = float(prev.stock)
            except Stock.DoesNotExist:
                prev_stock = None
        else:
            prev_stock = None
        stock_actual = float(self.stock)
        stock_min = float(self.stock_minimo) if self.stock_minimo is not None else 0
        stock_max = float(self.stock_maximo) if self.stock_maximo is not None else None
        producto = self.productos_fk
        super().save(*args, **kwargs)
        # Notificar si stock cruza el mínimo (de normal a crítico)
        if prev_stock is not None and prev_stock > stock_min and stock_actual <= stock_min:
            if self.bodega_fk:
                usuarios = Usuario.objects.filter(bodeg_fk=self.bodega_fk)
                ubicacion = BodegaCentral.objects.filter(id_bdg=self.bodega_fk).first()
                ubicacion_nombre = ubicacion.nombre_bdg if ubicacion else 'Bodega'
            elif self.sucursal_fk:
                usuarios = Usuario.objects.filter(sucursal_fk=self.sucursal_fk)
                ubicacion = Sucursal.objects.filter(id=self.sucursal_fk).first()
                ubicacion_nombre = ubicacion.nombre_sucursal if ubicacion else 'Sucursal'
            else:
                usuarios = []
                ubicacion_nombre = 'Ubicación desconocida'
            for usuario in usuarios:
                crear_notificacion(
                    usuario=usuario,
                    nombre=f"Stock crítico: {producto.nombre_prodc}",
                    descripcion=f"El stock del producto '{producto.nombre_prodc}' en {ubicacion_nombre} está en {stock_actual} (mínimo: {stock_min})",
                    tipo="error",
                    producto=producto
                )
        # Notificar si stock cruza el máximo (de normal a máximo)
        if stock_max is not None and prev_stock is not None and prev_stock < stock_max and stock_actual >= stock_max:
            if self.bodega_fk:
                usuarios = Usuario.objects.filter(bodeg_fk=self.bodega_fk)
                ubicacion = BodegaCentral.objects.filter(id_bdg=self.bodega_fk).first()
                ubicacion_nombre = ubicacion.nombre_bdg if ubicacion else 'Bodega'
            elif self.sucursal_fk:
                usuarios = Usuario.objects.filter(sucursal_fk=self.sucursal_fk)
                ubicacion = Sucursal.objects.filter(id=self.sucursal_fk).first()
                ubicacion_nombre = ubicacion.nombre_sucursal if ubicacion else 'Sucursal'
            else:
                usuarios = []
                ubicacion_nombre = 'Ubicación desconocida'
            for usuario in usuarios:
                crear_notificacion(
                    usuario=usuario,
                    nombre=f"Stock máximo superado: {producto.nombre_prodc}",
                    descripcion=f"El stock del producto '{producto.nombre_prodc}' en {ubicacion_nombre} está en {stock_actual} (máximo: {stock_max})",
                    tipo="warning",
                    producto=producto
                )

class MovInventario(models.Model):
    id_mvin = models.BigAutoField(primary_key=True)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField()
    productos_fk = models.ForeignKey(Productos, on_delete=models.CASCADE)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_fk')
    motivo = models.TextField(null=True, blank=True)
    stock_fk = models.ForeignKey(Stock, null=True, blank=True, on_delete=models.SET_NULL, db_column='stock_fk')

    class Meta:
        db_table = 'mov_inventario'
        managed = False

    @property
    def id(self):
        return self.id_mvin

    @property
    def ubicacion_nombre(self):
        if self.stock_fk:
            # Si es por bodega
            if self.stock_fk.bodega_fk:
                from api.models import BodegaCentral
                try:
                    bodega = BodegaCentral.objects.get(id_bdg=self.stock_fk.bodega_fk)
                    return f"Bodega: {bodega.nombre_bdg}"
                except BodegaCentral.DoesNotExist:
                    return "Bodega desconocida"
            # Si es por sucursal
            elif self.stock_fk.sucursal_fk:
                from api.models import Sucursal
                try:
                    sucursal = Sucursal.objects.get(id=self.stock_fk.sucursal_fk)
                    return f"Sucursal: {sucursal.nombre_sucursal}"
                except Sucursal.DoesNotExist:
                    return "Sucursal desconocida"
        return "Sin ubicación"

class Notificacion(models.Model):
    TIPO_CHOICES = [
        ('info', 'Información'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
        ('success', 'Éxito'),
    ]
    id_ntf = models.BigAutoField(primary_key=True)
    nombre_ntf = models.CharField(max_length=255)
    descripcion = models.TextField()
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='notificaciones', db_column='usuario_fk')
    pedido_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE, null=True, blank=True, db_column='pedido_fk')
    producto_fk = models.ForeignKey(Productos, on_delete=models.CASCADE, null=True, blank=True, db_column='producto_fk')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='info')
    leida = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, null=True)
    fecha_hora_ntd = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.nombre_ntf} - {self.usuario_fk}'

    class Meta:
        db_table = 'notificacion'
        managed = False

    @property
    def id(self):
        return self.id_ntf

class Historial(models.Model):
    id_hst = models.BigAutoField(primary_key=True)
    fecha = models.DateTimeField(auto_now_add=True)
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_fk')
    pedidos_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE, db_column='pedidos_fk')
    producto_fk = models.ForeignKey(Productos, on_delete=models.CASCADE, db_column='producto_fk_id')

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

class UsuarioNotificacion(models.Model):
    id_ntf_us = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='usuario_id'
    )
    notificacion = models.ForeignKey(
        Notificacion,
        on_delete=models.CASCADE,
        db_column='notificacion_id'
    )
    leida = models.BooleanField(default=False)
    eliminada = models.BooleanField(default=False)
    fecha_recibida = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario_notificacion'

class HistorialEstadoPedido(models.Model):
    id_hist_ped = models.BigAutoField(primary_key=True)
    pedido_fk = models.ForeignKey(Pedidos, on_delete=models.CASCADE, db_column='pedido_fk')
    estado_anterior = models.ForeignKey(EstadoPedido, on_delete=models.SET_NULL, null=True, related_name='historial_estado_anterior', db_column='estado_anterior')
    estado_nuevo = models.ForeignKey(EstadoPedido, on_delete=models.CASCADE, related_name='historial_estado_nuevo', db_column='estado_nuevo')
    usuario_fk = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, db_column='usuario_fk')
    fecha = models.DateTimeField(auto_now_add=True)
    comentario = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'historial_estado_pedido'
        managed = True

    def __str__(self):
        return f"Pedido {self.pedido_fk.id_p}: {self.estado_anterior} → {self.estado_nuevo} por {self.usuario_fk} en {self.fecha}"