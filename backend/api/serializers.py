from rest_framework import serializers
from django.utils import timezone
from .models import (
    BodegaCentral, Categoria, DetallePedido, EstadoPedido, Historial, Informe,
    Marca, Modulos, MovInventario, Notificacion, Pedidos, Permisos,
    PersonalEntrega, Productos, Proveedor, Rol, Solicitudes, Stock, Sucursal, Usuario, Stock, SolicitudProductos
)
import random

class BodegaCentralSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodegaCentral
        fields = ['id_bdg', 'nombre_bdg', 'direccion', 'rut']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']
        read_only_fields = ['id']

    def validate_nombre(self, value):
        if not value:
            raise serializers.ValidationError("El nombre de la categoría es requerido")
        if len(value) > 255:
            raise serializers.ValidationError("El nombre no puede tener más de 255 caracteres")
        return value

    def validate_descripcion(self, value):
        if not value:
            raise serializers.ValidationError("La descripción de la categoría es requerida")
        if len(value) > 255:
            raise serializers.ValidationError("La descripción no puede tener más de 255 caracteres")
        return value

class DetallePedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedido
        fields = '__all__' 

class EstadoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPedido
        fields = '__all__'

class HistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historial
        fields = '__all__'

class InformeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Informe
        fields = '__all__'

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['id_mprod', 'nombre_mprod', 'descripcion_mprod']
        read_only_fields = ['id_mprod']

    def validate_nombre_mprod(self, value):
        if not value:
            raise serializers.ValidationError("El nombre de la marca es requerido")
        if len(value) > 255:
            raise serializers.ValidationError("El nombre no puede tener más de 255 caracteres")
        return value

    def validate_descripcion_mprod(self, value):
        if not value:
            raise serializers.ValidationError("La descripción de la marca es requerida")
        if len(value) > 255:
            raise serializers.ValidationError("La descripción no puede tener más de 255 caracteres")
        return value

class ModulosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulos
        fields = '__all__'

class MovInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovInventario
        fields = '__all__'

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'


class PermisosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permisos
        fields = '__all__'


class ProductosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = [
            'id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
            'fecha_creacion', 'marca_fk', 'categoria_fk', 'bodega_fk', 'sucursal_fk'
        ]
        read_only_fields = ['id_prodc', 'fecha_creacion']

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class SolicitudProductosSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto_fk.nombre_prodc', read_only=True)
    producto_codigo = serializers.CharField(source='producto_fk.codigo_interno', read_only=True)
    
    class Meta:
        model = SolicitudProductos
        fields = ['id_solc_prod', 'cantidad', 'producto_fk', 'producto_nombre', 'producto_codigo']

class SolicitudesSerializer(serializers.ModelSerializer):
    sucursal_nombre = serializers.CharField(source='fk_sucursal.nombre_sucursal', read_only=True)
    bodega_nombre = serializers.CharField(source='fk_bodega.nombre_bdg', read_only=True)
    usuario_nombre = serializers.CharField(source='usuarios_fk.nombre', read_only=True)
    productos = SolicitudProductosSerializer(many=True, read_only=True)
    
    class Meta:
        model = Solicitudes
        fields = [
            'id_solc', 'fecha_creacion', 'observacion',
            'fk_sucursal', 'sucursal_nombre', 'fk_bodega', 'bodega_nombre',
            'usuarios_fk', 'usuario_nombre', 'productos'
        ]
        read_only_fields = ['id_solc', 'fecha_creacion']

    def create(self, validated_data):
        validated_data['fecha_creacion'] = timezone.now()
        return super().create(validated_data)

class SolicitudesCreateSerializer(serializers.ModelSerializer):
    productos = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        help_text="Lista de productos con cantidad: [{'producto_id': 1, 'cantidad': 5}]"
    )
    
    class Meta:
        model = Solicitudes
        fields = [
            'observacion', 'fk_sucursal', 'fk_bodega', 'usuarios_fk', 'productos'
        ]

    def create(self, validated_data):
        productos_data = validated_data.pop('productos', [])
        validated_data['fecha_creacion'] = timezone.now()
        
        solicitud = super().create(validated_data)
        
        # Crear los productos de la solicitud
        for producto_data in productos_data:
            SolicitudProductos.objects.create(
                solicitud_fk=solicitud,
                producto_fk_id=producto_data['producto_id'],
                cantidad=producto_data['cantidad']
            )
        
        return solicitud

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = ['id', 'nombre_sucursal', 'direccion', 'descripcion', 'bodega_fk', 'rut']

class UsuarioSerializer(serializers.ModelSerializer):
    # Campo para leer el nombre del rol, pero no para escribirlo
    rol_nombre = serializers.CharField(source='rol_fk.nombre_rol', read_only=True)

    class Meta:
        model = Usuario
        # Lista explícita de campos para evitar los problemáticos y la contraseña

        #contraseña solo lectura
        contrasena = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
        fields = [
            'id_us', 'rut', 'nombre', 'correo','contrasena',
            'bodeg_fk', 'sucursal_fk', 'rol_fk', 'rol_nombre',
            'is_active',
        ]
        # El campo rol_fk es solo para escritura (al crear/actualizar)
        extra_kwargs = {
            'rol_fk': {'write_only': True}
        }
    def create(self, validated_data):
        """
        Sobrescribimos el método create para hashear la contraseña.
        """
        # Extraemos la contraseña del diccionario de datos validados
        password = validated_data.pop('contrasena')
        # Creamos la instancia del usuario con los datos restantes
        usuario = Usuario(**validated_data)
        # Usamos el método set_password de Django que se encarga de hashear
        usuario.set_password(password)
        usuario.save()
        return usuario
    def update(self, instance, validated_data):
        """
        Sobrescribimos el método update para manejar la actualización de la contraseña.
        """
        # Si se proporciona una nueva contraseña, la hasheamos, evitando que la contraseña se guarde en un texto plano
        password = validated_data.pop('contrasena', None)
        if password:
            instance.set_password(password)

        # Actualizamos los otros campos usando el método por defecto.
        instance = super().update(instance, validated_data)
        return instance


class LoginSerializer(serializers.Serializer):
    correo = serializers.EmailField()
    contrasena = serializers.CharField()

class RegisterSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=255)
    correo = serializers.EmailField()
    contrasena = serializers.CharField()
    rut = serializers.CharField(max_length=12)
    rol = serializers.CharField()
    bodega = serializers.CharField(required=False, allow_null=True)
    sucursal = serializers.CharField(required=False, allow_null=True)

class PersonalEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalEntrega
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='id_prodc', read_only=True)
    marca_nombre = serializers.CharField(source='marca_fk.nombre_mprod', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria_fk.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega_fk.nombre_bdg', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal_fk.nombre_sucursal', read_only=True)
    stock = serializers.SerializerMethodField()
    stock_minimo = serializers.SerializerMethodField()
    stock_inicial = serializers.IntegerField(write_only=True, required=False, default=0)
    

    class Meta:
        model = Productos
        fields = [
            'id', 'id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
            'fecha_creacion', 'marca_fk', 'marca_nombre', 'categoria_fk', 'categoria_nombre',
            'bodega_fk', 'bodega_nombre', 'sucursal_fk', 'sucursal_nombre', 'stock', 'stock_minimo' ,'stock_inicial'
        ]
        read_only_fields = ['id_prodc', 'fecha_creacion']
        extra_kwargs = {
            'stock': {'write_only': True}  # El stock se usa solo para crear, no se devuelve en la respuesta
        }

    def get_stock(self, obj):
        from .models import Stock
        try:
            stock_obj = Stock.objects.filter(productos_fk=obj).first()
            if stock_obj:
                return float(stock_obj.stock)
            else:
                # Si no hay stock, crear uno automáticamente con stock aleatorio
                stock_aleatorio = random.randint(10, 100)
                stock_obj = Stock.objects.create(
                    productos_fk=obj,
                    stock=stock_aleatorio,
                    stock_minimo=5,
                    bodega_fk=obj.bodega_fk.id_bdg if obj.bodega_fk else None,
                    sucursal_fk=obj.sucursal_fk.id if obj.sucursal_fk else None,
                    proveedor_fk=None
                )
                return stock_aleatorio
        except Exception as e:
            print(f"Error al obtener stock para producto {obj.id_prodc}: {e}")
            return 0

    def get_stock_minimo(self, obj):
        from .models import Stock
        try:
            stock_obj = Stock.objects.filter(productos_fk=obj).first()
            if stock_obj:
                return float(stock_obj.stock_minimo)
            else:
                return 0
        except Exception as e:
            print(f"Error al obtener stock_minimo para producto {obj.id_prodc}: {e}")
            return 0

    def validate_marca_fk(self, value):
        # Si es un ID numérico, buscar la instancia
        if isinstance(value, int):
            try:
                return Marca.objects.get(id_mprod=value)
            except Marca.DoesNotExist:
                raise serializers.ValidationError("Marca no encontrada")
        # Si ya es una instancia, devolverla
        elif isinstance(value, Marca):
            return value
        else:
            raise serializers.ValidationError("Valor inválido para marca")

    def validate_categoria_fk(self, value):
        # Si es un ID numérico, buscar la instancia
        if isinstance(value, int):
            try:
                return Categoria.objects.get(id=value)
            except Categoria.DoesNotExist:
                raise serializers.ValidationError("Categoría no encontrada")
        # Si ya es una instancia, devolverla
        elif isinstance(value, Categoria):
            return value
        else:
            raise serializers.ValidationError("Valor inválido para categoría")

    def validate(self, data):
        if not data.get('marca_fk'):
            raise serializers.ValidationError({"marca_fk": "Este campo es requerido"})
        if not data.get('categoria_fk'):
            raise serializers.ValidationError({"categoria_fk": "Este campo es requerido"})
        if not data.get('nombre_prodc'):
            raise serializers.ValidationError({"nombre_prodc": "Este campo es requerido"})
        if not data.get('codigo_interno'):
            raise serializers.ValidationError({"codigo_interno": "Este campo es requerido"})
        return data

    def create(self, validated_data):
        print(f"DEBUG - validated_data recibido: {validated_data}")
        
        # Extraer el stock del validated_data
        stock_inicial = validated_data.pop('stock_inicial', 0)
        print(f"DEBUG - stock_inicial extraído: {stock_inicial}")
        
        # Agregar fecha de creación automáticamente
        validated_data['fecha_creacion'] = timezone.now()
        
        # Crear el producto
        producto = super().create(validated_data)
        print(f"DEBUG - producto creado con ID: {producto.id_prodc}")
        
        # Crear automáticamente un registro de stock para el producto con el stock inicial
        from .models import Stock
        stock_obj = Stock.objects.create(
            productos_fk=producto,
            stock=stock_inicial,  # Usar el stock que envió el usuario
            stock_minimo=0,  # Stock mínimo en 0 por defecto
            bodega_fk=producto.bodega_fk.id_bdg if producto.bodega_fk else None,
            sucursal_fk=producto.sucursal_fk.id if producto.sucursal_fk else None,
            proveedor_fk=None
        )
        print(f"DEBUG - stock creado con valor: {stock_obj.stock}")
        
        return producto
    
class PedidosSerializer(serializers.ModelSerializer):
    sucursal_fk = SucursalSerializer(read_only=True)
    solicitud_fk = SolicitudesSerializer(read_only=True)
    personal_entrega_fk = PersonalEntregaSerializer(read_only=True)
    class Meta:
        model = Pedidos
        fields = '__all__'