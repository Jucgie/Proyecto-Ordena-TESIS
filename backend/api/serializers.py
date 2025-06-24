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
    producto_nombre = serializers.CharField(source='productos_pedido_fk.nombre_prodc', read_only=True)
    producto_codigo = serializers.CharField(source='productos_pedido_fk.codigo_interno', read_only=True)
    
    class Meta:
        model = DetallePedido
        fields = ['id', 'cantidad', 'descripcion', 'productos_pedido_fk', 'producto_nombre', 'producto_codigo']

class EstadoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPedido
        fields = '__all__'

class HistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historial
        fields = '__all__'

class InformeSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)
    
    class Meta:
        model = Informe
        fields = [
            'id_informe', 'titulo', 'descripcion', 'modulo_origen', 
            'contenido', 'archivo_url', 'fecha_generado', 
            'usuario_fk', 'usuario_nombre', 'pedidos_fk', 'productos_fk'
        ]
        read_only_fields = ['id_informe', 'fecha_generado']

    def create(self, validated_data):
        validated_data['fecha_generado'] = timezone.now()
        return super().create(validated_data)

class InformeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Informe
        fields = [
            'titulo', 'descripcion', 'modulo_origen', 
            'contenido', 'archivo_url', 'usuario_fk', 'pedidos_fk', 'productos_fk'
        ]

    def create(self, validated_data):
        validated_data['fecha_generado'] = timezone.now()
        return super().create(validated_data)

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['id_mprod', 'nombre_mprod', 'descripcion_mprod']
        read_only_fields = ['id_mprod']

    def validate_nombre_mprod(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El nombre de la marca no puede estar vacío")
        return value.strip()

    def validate_descripcion_mprod(self, value):
        if value and len(value.strip()) == 0:
            raise serializers.ValidationError("La descripción de la marca no puede estar vacía")
        return value.strip() if value else value

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

class PedidosSerializer(serializers.ModelSerializer):
    sucursal_nombre = serializers.CharField(source='sucursal_fk.nombre_sucursal', read_only=True)
    sucursal_direccion = serializers.CharField(source='sucursal_fk.direccion', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega_fk.nombre_bdg', read_only=True)
    bodega_direccion = serializers.CharField(source='bodega_fk.direccion', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)
    personal_entrega_nombre = serializers.CharField(source='personal_entrega_fk.nombre_psn', read_only=True)
    personal_entrega_patente = serializers.CharField(source='personal_entrega_fk.patente', read_only=True)
    estado_pedido_nombre = serializers.CharField(source='estado_pedido_fk.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor_fk.nombres_provd', read_only=True)
    solicitud_id = serializers.IntegerField(source='solicitud_fk.id_solc', read_only=True)
    detalles_pedido = DetallePedidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pedidos
        fields = [
            'id_p', 'descripcion', 'fecha_entrega', 'estado_pedido_fk', 'estado_pedido_nombre',
            'sucursal_fk', 'sucursal_nombre', 'sucursal_direccion', 'personal_entrega_fk', 'personal_entrega_nombre', 'personal_entrega_patente',
            'usuario_fk', 'usuario_nombre', 'solicitud_fk', 'solicitud_id',
            'bodega_fk', 'bodega_nombre', 'bodega_direccion', 'proveedor_fk', 'proveedor_nombre',
            'detalles_pedido'
        ]
        read_only_fields = ['id_p']

class PedidosCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedidos
        fields = [
            'descripcion', 'fecha_entrega', 'estado_pedido_fk', 'sucursal_fk',
            'personal_entrega_fk', 'usuario_fk', 'solicitud_fk', 'bodega_fk', 'proveedor_fk'
        ]
        extra_kwargs = {
            'fecha_entrega': {'required': False}  # No requerido porque se asigna automáticamente
        }

    def create(self, validated_data):
        validated_data['fecha_entrega'] = timezone.now()
        return super().create(validated_data)

class PermisosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permisos
        fields = '__all__'

class PersonalEntregaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario_fk.correo', read_only=True)
    
    class Meta:
        model = PersonalEntrega
        fields = ['id_psn', 'usuario_fk', 'usuario_nombre', 'usuario_correo', 'nombre_psn', 'descripcion', 'patente']

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
    sucursal_direccion = serializers.CharField(source='fk_sucursal.direccion', read_only=True)
    sucursal_rut = serializers.CharField(source='fk_sucursal.rut', read_only=True)
    bodega_nombre = serializers.CharField(source='fk_bodega.nombre_bdg', read_only=True)
    usuario_nombre = serializers.CharField(source='usuarios_fk.nombre', read_only=True)
    usuario_rol = serializers.CharField(source='usuarios_fk.rol_fk.nombre_rol', read_only=True)
    productos = SolicitudProductosSerializer(many=True, read_only=True)
    
    class Meta:
        model = Solicitudes
        fields = [
            'id_solc', 'fecha_creacion', 'estado', 'despachada', 'observacion',
            'fk_sucursal', 'sucursal_nombre', 'sucursal_direccion', 'sucursal_rut',
            'fk_bodega', 'bodega_nombre',
            'usuarios_fk', 'usuario_nombre', 'usuario_rol', 'productos'
        ]
        read_only_fields = ['id_solc', 'fecha_creacion']

    def to_representation(self, instance):
        """Sobrescribe la representación para agregar logs de debug"""
        representation = super().to_representation(instance)
        
        # Logs de debug
        print(f"DEBUG - Serializando solicitud {instance.id_solc}:")
        print(f"  - Sucursal FK: {instance.fk_sucursal}")
        print(f"  - Sucursal nombre: {getattr(instance.fk_sucursal, 'nombre_sucursal', 'N/A')}")
        print(f"  - Sucursal dirección: {getattr(instance.fk_sucursal, 'direccion', 'N/A')}")
        print(f"  - Sucursal RUT: {getattr(instance.fk_sucursal, 'rut', 'N/A')}")
        print(f"  - Usuario FK: {instance.usuarios_fk}")
        print(f"  - Usuario nombre: {getattr(instance.usuarios_fk, 'nombre', 'N/A')}")
        print(f"  - Usuario rol: {getattr(instance.usuarios_fk.rol_fk, 'nombre_rol', 'N/A') if instance.usuarios_fk.rol_fk else 'N/A'}")
        
        return representation

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
            'id_solc', 'fecha_creacion', 'estado', 'despachada', 'observacion',
            'fk_sucursal', 'fk_bodega', 'usuarios_fk', 'productos'
        ]
        read_only_fields = ['id_solc', 'fecha_creacion']

    def validate(self, data):
        print(f"DEBUG - SolicitudesCreateSerializer.validate - Datos recibidos: {data}")
        
        # Validar que se proporcionen los campos requeridos
        if not data.get('fk_sucursal'):
            raise serializers.ValidationError({"fk_sucursal": "Este campo es requerido"})
        if not data.get('fk_bodega'):
            raise serializers.ValidationError({"fk_bodega": "Este campo es requerido"})
        if not data.get('usuarios_fk'):
            raise serializers.ValidationError({"usuarios_fk": "Este campo es requerido"})
        if not data.get('productos'):
            raise serializers.ValidationError({"productos": "Debe incluir al menos un producto"})
        
        # Validar productos
        productos = data.get('productos', [])
        for i, producto in enumerate(productos):
            if not producto.get('producto_id'):
                raise serializers.ValidationError({f"productos[{i}].producto_id": "ID de producto es requerido"})
            if not producto.get('cantidad') or producto['cantidad'] <= 0:
                raise serializers.ValidationError({f"productos[{i}].cantidad": "Cantidad debe ser mayor a 0"})
        
        print(f"DEBUG - SolicitudesCreateSerializer.validate - Datos validados: {data}")
        return data

    def create(self, validated_data):
        print(f"DEBUG - SolicitudesCreateSerializer.create - Datos validados: {validated_data}")
        
        productos_data = validated_data.pop('productos', [])
        validated_data['fecha_creacion'] = timezone.now()
        
        print(f"DEBUG - Creando solicitud con datos: {validated_data}")
        solicitud = super().create(validated_data)
        print(f"DEBUG - Solicitud creada: {solicitud.id_solc}")
        
        # Crear los productos de la solicitud
        for producto_data in productos_data:
            print(f"DEBUG - Creando producto de solicitud: {producto_data}")
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
        fields = [
            'id_us', 'rut', 'nombre', 'correo',
            'bodeg_fk', 'sucursal_fk', 'rol_fk', 'rol_nombre',
            'is_active',
        ]
        # El campo rol_fk es solo para escritura (al crear/actualizar)
        extra_kwargs = {
            'rol_fk': {'write_only': True}
        }

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
    stock_write = serializers.IntegerField(write_only=True, required=False, source='stock')

    def get_stock(self, obj):
        """Obtiene el stock real desde la tabla Stock"""
        try:
            # Obtener el contexto de la consulta
            request = self.context.get('request')
            if not request:
                return 0
            
            # Obtener parámetros de la consulta
            sucursal_id = request.query_params.get('sucursal_id')
            bodega_id = request.query_params.get('bodega_id')
            
            # Buscar stock basándose en el contexto de la consulta
            if sucursal_id:
                stock_obj = Stock.objects.filter(
                    productos_fk=obj,
                    sucursal_fk=sucursal_id
                ).first()
            elif bodega_id:
                stock_obj = Stock.objects.filter(
                    productos_fk=obj,
                    bodega_fk=bodega_id
                ).first()
            else:
                # Fallback: usar los campos del producto
                if obj.bodega_fk:
                    stock_obj = Stock.objects.filter(
                        productos_fk=obj,
                        bodega_fk=obj.bodega_fk.id_bdg
                    ).first()
                elif obj.sucursal_fk:
                    stock_obj = Stock.objects.filter(
                        productos_fk=obj,
                        sucursal_fk=obj.sucursal_fk.id
                    ).first()
                else:
                    return 0
            
            return float(stock_obj.stock) if stock_obj else 0
        except Exception as e:
            print(f"Error en get_stock para producto {obj.id_prodc}: {str(e)}")
            return 0
    

    class Meta:
        model = Productos
        fields = [
            'id', 'id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
            'fecha_creacion', 'marca_fk', 'marca_nombre', 'categoria_fk', 'categoria_nombre',
            'bodega_fk', 'bodega_nombre', 'sucursal_fk', 'sucursal_nombre', 'stock', 'stock_minimo' ,'stock_write'
        ]
        read_only_fields = ['id_prodc', 'fecha_creacion']

    def create(self, validated_data):
        stock_data = validated_data.pop('stock', 0)
        validated_data['fecha_creacion'] = timezone.now()
        producto = Productos.objects.create(**validated_data)
        
        # Crear el registro de stock
        Stock.objects.create(
            productos_fk=producto,
            stock=stock_data,
            stock_minimo=5, # Valor por defecto
            bodega_fk=producto.bodega_fk.id_bdg if producto.bodega_fk else None,
            sucursal_fk=producto.sucursal_fk.id if producto.sucursal_fk else None,
            proveedor_fk=None
        )
        return producto

    def update(self, instance, validated_data):
        stock_data = validated_data.pop('stock', None)

        # Actualiza los campos del producto principal
        instance = super().update(instance, validated_data)

        # Si se envió un nuevo stock, actualiza la tabla Stock
        if stock_data is not None:
            # Determinar si es bodega o sucursal
            if instance.bodega_fk:
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=instance,
                    bodega_fk=instance.bodega_fk.id_bdg,
                    defaults={
                        'stock': 0,
                        'stock_minimo': 5,
                        'sucursal_fk': None,
                        'proveedor_fk': None
                    }
                )
            elif instance.sucursal_fk:
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=instance,
                    sucursal_fk=instance.sucursal_fk.id,
                    defaults={
                        'stock': 0,
                        'stock_minimo': 5,
                        'bodega_fk': None,
                        'proveedor_fk': None
                    }
                )
            else:
                return instance
            
            stock_obj.stock = stock_data
            stock_obj.save()

        return instance

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
    