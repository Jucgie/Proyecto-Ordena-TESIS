from rest_framework import serializers
from django.utils import timezone
import pytz
from .models import (
    BodegaCentral, Categoria, DetallePedido, EstadoPedido, Historial, Informe,
    Marca, Modulos, MovInventario, Notificacion, Pedidos, Permisos,
    PersonalEntrega, Productos, Proveedor, Rol, Solicitudes, Stock, Sucursal, Usuario, Stock, SolicitudProductos, UsuarioNotificacion,
    HistorialEstadoPedido
)
import random
import re

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
    producto_marca = serializers.CharField(source='productos_pedido_fk.marca_fk.nombre_mprod', read_only=True)
    producto_categoria = serializers.CharField(source='productos_pedido_fk.categoria_fk.nombre', read_only=True)
    
    class Meta:
        model = DetallePedido
        fields = ['id', 'cantidad', 'descripcion', 'productos_pedido_fk', 'producto_nombre', 'producto_codigo', 'producto_marca', 'producto_categoria']

class EstadoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPedido
        fields = '__all__'

class HistorialSerializer(serializers.ModelSerializer):
    fecha = serializers.DateTimeField(format=None)
    class Meta:
        model = Historial
        fields = '__all__'

class InformeSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)
    fecha_generado = serializers.DateTimeField(format=None)
    
    class Meta:
        model = Informe
        fields = [
            'id_informe', 'titulo', 'descripcion', 'modulo_origen', 
            'contenido', 'archivo_url', 'fecha_generado', 
            'usuario_fk', 'usuario_nombre', 'pedidos_fk', 'productos_fk',
            'bodega_fk', 'sucursal_fk'
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
            'contenido', 'archivo_url', 'usuario_fk', 'pedidos_fk', 'productos_fk',
            'bodega_fk', 'sucursal_fk'
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
    producto_nombre = serializers.CharField(source='productos_fk.nombre_prodc', read_only=True)
    producto_codigo = serializers.CharField(source='productos_fk.codigo_interno', read_only=True)
    producto_id = serializers.CharField(source='productos_fk.id_prodc', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)
    tipo_movimiento = serializers.SerializerMethodField()
    stock_actual = serializers.SerializerMethodField()
    stock_antes = serializers.SerializerMethodField()
    stock_despues = serializers.SerializerMethodField()
    ubicacion = serializers.SerializerMethodField()
    icono_movimiento = serializers.SerializerMethodField()
    color_movimiento = serializers.SerializerMethodField()
    descripcion_movimiento = serializers.SerializerMethodField()
    ubicacion_nombre = serializers.ReadOnlyField()

    class Meta:
        model = MovInventario
        fields = [
            'id_mvin', 'cantidad', 'fecha', 'productos_fk', 'producto_nombre', 'producto_codigo', 'producto_id',
            'usuario_fk', 'usuario_nombre', 'tipo_movimiento', 'stock_actual', 'stock_antes', 'stock_despues', 'motivo',
            'ubicacion', 'ubicacion_nombre',  # <-- Agregado
            'icono_movimiento', 'color_movimiento', 'descripcion_movimiento'
        ]
    

    def get_tipo_movimiento(self, obj):
        """Determina el tipo de movimiento basado en la cantidad"""
        if obj.cantidad > 0:
            return "ENTRADA"
        elif obj.cantidad < 0:
            return "SALIDA"
        else:
            return "AJUSTE"

    def get_stock_actual(self, obj):
        """Obtiene el stock actual del producto"""
        try:
            if obj.productos_fk.bodega_fk:
                bodega_id = obj.productos_fk.bodega_fk.id_bdg if hasattr(obj.productos_fk.bodega_fk, 'id_bdg') else obj.productos_fk.bodega_fk
                stock_obj = Stock.objects.filter(
                    productos_fk=obj.productos_fk,
                    bodega_fk=bodega_id
                ).first()
            elif obj.productos_fk.sucursal_fk:
                sucursal_id = obj.productos_fk.sucursal_fk.id if hasattr(obj.productos_fk.sucursal_fk, 'id') else obj.productos_fk.sucursal_fk
                stock_obj = Stock.objects.filter(
                    productos_fk=obj.productos_fk,
                    sucursal_fk=sucursal_id
                ).first()
            else:
                stock_obj = None
            return float(stock_obj.stock) if stock_obj else 0
        except Exception as e:
            print(f"Error obteniendo stock actual: {e}")
            return 0

    def get_stock_antes(self, obj):
        """
        Calcula el stock antes del movimiento SOLO considerando la ubicación (stock_fk).
        """
        try:
            from api.models import MovInventario
            movimientos = MovInventario.objects.filter(
                productos_fk=obj.productos_fk,
                stock_fk=obj.stock_fk
            ).order_by('-fecha', '-id_mvin')
            stock_actual = float(obj.stock_fk.stock) if obj.stock_fk and hasattr(obj.stock_fk, 'stock') else 0
            stock_acumulado = stock_actual
            for mov in movimientos:
                if mov.id_mvin == obj.id_mvin:
                    stock_despues = stock_acumulado
                    stock_antes = stock_despues - mov.cantidad
                    return stock_antes
                stock_acumulado -= mov.cantidad
            return 0
        except Exception as e:
            print(f"Error calculando stock antes (ubicación): {e}")
            return 0

    def get_stock_despues(self, obj):
        """
        Calcula el stock después del movimiento SOLO considerando la ubicación (stock_fk).
        """
        try:
            from api.models import MovInventario
            movimientos = MovInventario.objects.filter(
                productos_fk=obj.productos_fk,
                stock_fk=obj.stock_fk
            ).order_by('-fecha', '-id_mvin')
            stock_actual = float(obj.stock_fk.stock) if obj.stock_fk and hasattr(obj.stock_fk, 'stock') else 0
            stock_acumulado = stock_actual
            for mov in movimientos:
                if mov.id_mvin == obj.id_mvin:
                    return stock_acumulado
                stock_acumulado -= mov.cantidad
            return 0
        except Exception as e:
            print(f"Error calculando stock despues (ubicación): {e}")
            return 0

    def get_ubicacion(self, obj):
        """Obtiene la ubicación (bodega o sucursal) REAL del movimiento usando stock_fk"""
        stock = getattr(obj, 'stock_fk', None)
        if stock:
            # Si es un ID, busca la instancia
            bodega = getattr(stock, 'bodega_fk', None)
            sucursal = getattr(stock, 'sucursal_fk', None)
            if isinstance(bodega, int):
                from api.models import BodegaCentral
                bodega = BodegaCentral.objects.filter(id_bdg=bodega).first()
            if isinstance(sucursal, int):
                from api.models import Sucursal
                sucursal = Sucursal.objects.filter(id=sucursal).first()
            if bodega:
                return f"Bodega: {bodega.nombre_bdg}"
            elif sucursal:
                return f"Sucursal: {sucursal.nombre_sucursal}"
        return "Sin ubicación"

    def get_icono_movimiento(self, obj):
        """Retorna el icono apropiado para el tipo de movimiento"""
        tipo = self.get_tipo_movimiento(obj)
        if tipo == "ENTRADA":
            return "📥"
        elif tipo == "SALIDA":
            return "📤"
        else:
            return "⚙️"

    def get_color_movimiento(self, obj):
        """Retorna el color apropiado para el tipo de movimiento"""
        tipo = self.get_tipo_movimiento(obj)
        if tipo == "ENTRADA":
            return "#4CAF50"  # Verde
        elif tipo == "SALIDA":
            return "#F44336"  # Rojo
        else:
            return "#FF9800"  # Naranja

    def get_descripcion_movimiento(self, obj):
        """Genera una descripción del movimiento"""
        tipo = self.get_tipo_movimiento(obj)
        cantidad_abs = abs(obj.cantidad)
        if tipo == "ENTRADA":
            return f"Entrada de {cantidad_abs} unidades"
        elif tipo == "SALIDA":
            return f"Salida de {cantidad_abs} unidades"
        else:
            return f"Ajuste de {cantidad_abs} unidades"

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            'id_ntf', 'nombre_ntf', 'descripcion', 'usuario_fk', 'pedido_fk', 'producto_fk',
            'tipo', 'leida', 'link', 'fecha_hora_ntd'
        ]
        read_only_fields = ['id_ntf', 'fecha_hora_ntd']

class UsuarioNotificacionSerializer(serializers.ModelSerializer):
    notificacion = NotificacionSerializer(read_only=True)

    class Meta:
        model = UsuarioNotificacion
        fields = ['id_ntf_us', 'usuario', 'notificacion', 'leida', 'eliminada', 'fecha_recibida']

class PedidosSerializer(serializers.ModelSerializer):
    fecha_entrega = serializers.DateTimeField(format=None)
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
    tipo = serializers.SerializerMethodField()
    num_guia_despacho = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def get_tipo(self, obj):
        if obj.proveedor_fk:
            return "ingreso"
        elif obj.sucursal_fk:
            return "salida"
        return "desconocido"

    class Meta:
        model = Pedidos
        fields = [
            'id_p', 'descripcion', 'fecha_entrega', 'estado_pedido_fk', 'estado_pedido_nombre',
            'sucursal_fk', 'sucursal_nombre', 'sucursal_direccion', 'personal_entrega_fk', 'personal_entrega_nombre', 'personal_entrega_patente',
            'usuario_fk', 'usuario_nombre', 'solicitud_fk', 'solicitud_id',
            'bodega_fk', 'bodega_nombre', 'bodega_direccion', 'proveedor_fk', 'proveedor_nombre',
            'num_guia_despacho',
            'detalles_pedido', 'tipo'
        ]
        read_only_fields = ['id_p']

class PedidosCreateSerializer(serializers.ModelSerializer):
    num_guia_despacho = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    class Meta:
        model = Pedidos
        fields = [
            'descripcion', 'fecha_entrega', 'estado_pedido_fk', 'sucursal_fk',
            'personal_entrega_fk', 'usuario_fk', 'solicitud_fk', 'bodega_fk', 'proveedor_fk',
            'num_guia_despacho'
        ]
        extra_kwargs = {
            'fecha_entrega': {'required': False},  # No requerido porque se asigna automáticamente
            'personal_entrega_fk': {'required': False, 'allow_null': True},  # Opcional para ingresos
            'solicitud_fk': {'required': False, 'allow_null': True},  # Opcional para ingresos
            'sucursal_fk': {'required': False, 'allow_null': True},  # Opcional para ingresos de bodega
            'proveedor_fk': {'required': False, 'allow_null': True}  # Opcional para ingresos
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
        fields = ['id_psn', 'usuario_fk', 'usuario_nombre', 'usuario_correo', 'nombre_psn', 'descripcion_psn', 'patente']

class ProductosSerializer(serializers.ModelSerializer):
    fecha_creacion = serializers.DateTimeField(format=None)
    # Hacer la descripción opcional
    descripcion_prodc = serializers.CharField(required=False, allow_blank=True)
    
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
        fields = [
            'id_provd', 'nombres_provd', 'direccion_provd', 'correo', 
            'razon_social', 'rut_empresa'
        ]
        read_only_fields = ['id_provd']
        extra_kwargs = {
            'direccion_provd': {'required': False, 'allow_blank': True},
            'correo': {'required': False, 'allow_blank': True},
            'razon_social': {'required': False, 'allow_blank': True}
        }

    def validate_nombres_provd(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El nombre del proveedor no puede estar vacío")
        return value.strip()

    def validate_rut_empresa(self, value):
        if value:
            # Limpiar formato del RUT
            rut_limpio = str(value).replace('.', '').replace('-', '').replace(' ', '')
            
            # Remover el dígito verificador (último carácter)
            if rut_limpio and rut_limpio[-1].isalpha():
                rut_limpio = rut_limpio[:-1]
            
            # Convertir a número decimal
            try:
                return int(rut_limpio)
            except ValueError:
                raise serializers.ValidationError("El RUT debe ser un número válido")
        return value

    def validate_correo(self, value):
        if value and '@' not in value:
            raise serializers.ValidationError("El correo debe tener un formato válido")
        return value

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
    fecha_creacion = serializers.DateTimeField(format=None)
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
    stock_write = serializers.IntegerField(write_only=True, required=False, source='stock')
    stock_minimo = serializers.SerializerMethodField()
    stock_minimo_write = serializers.IntegerField(write_only=True, required=False, source='stock_minimo')
    stock_maximo = serializers.SerializerMethodField()
    stock_maximo_write = serializers.IntegerField(write_only=True, required=False, source='stock_maximo')
    motivo = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Hacer la descripción opcional
    descripcion_prodc = serializers.CharField(required=False, allow_blank=True)

    def get_stock(self, obj):
        try:
            request = self.context.get('request')
            if not request:
                return 0
            # Buscar sucursal_id y bodega_id en query params o en el body del request
            sucursal_id = request.query_params.get('sucursal_id') if hasattr(request, 'query_params') else None
            bodega_id = request.query_params.get('bodega_id') if hasattr(request, 'query_params') else None
            if (not sucursal_id or sucursal_id == '') and hasattr(request, 'data'):
                sucursal_id = request.data.get('sucursal_id')
            if (not bodega_id or bodega_id == '') and hasattr(request, 'data'):
                bodega_id = request.data.get('bodega_id')
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

    def get_stock_minimo(self, obj):
        """Obtiene el stock mínimo desde la tabla Stock"""
        try:
            request = self.context.get('request')
            if not request:
                return 0
            sucursal_id = request.query_params.get('sucursal_id')
            bodega_id = request.query_params.get('bodega_id')
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
            return float(stock_obj.stock_minimo) if stock_obj and stock_obj.stock_minimo is not None else 0
        except Exception as e:
            print(f"Error en get_stock_minimo para producto {obj.id_prodc}: {str(e)}")
            return 0

    def get_stock_maximo(self, obj):
        """Obtiene el stock máximo desde la tabla Stock"""
        try:
            request = self.context.get('request')
            if not request:
                return 0
            sucursal_id = request.query_params.get('sucursal_id')
            bodega_id = request.query_params.get('bodega_id')
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
            return float(stock_obj.stock_maximo) if stock_obj and stock_obj.stock_maximo is not None else 0
        except Exception as e:
            print(f"Error en get_stock_maximo para producto {obj.id_prodc}: {str(e)}")
            return 0

    class Meta:
        model = Productos
        fields = [
            'id', 'id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
            'fecha_creacion', 'marca_fk', 'marca_nombre', 'categoria_fk', 'categoria_nombre',
            'bodega_fk', 'bodega_nombre', 'sucursal_fk', 'sucursal_nombre',
            'stock', 'stock_minimo', 'stock_maximo', 'stock_write', 'stock_minimo_write', 'stock_maximo_write',
            'motivo'
        ]
        read_only_fields = ['id_prodc', 'fecha_creacion']

    def create(self, validated_data):
        # Validar unicidad de nombre y código (solo productos activos)
        nombre = validated_data.get('nombre_prodc')
        codigo = validated_data.get('codigo_interno')
        
        # Verificar si existe un producto desactivado con el mismo nombre
        producto_desactivado = Productos.objects.filter(nombre_prodc=nombre, activo=False).first()
        if producto_desactivado:
            # Si existe un producto desactivado, reactivarlo y actualizarlo
            producto_desactivado.activo = True
            producto_desactivado.descripcion_prodc = validated_data.get('descripcion_prodc', '')
            producto_desactivado.marca_fk = validated_data.get('marca_fk')
            producto_desactivado.categoria_fk = validated_data.get('categoria_fk')
            producto_desactivado.bodega_fk = validated_data.get('bodega_fk')
            producto_desactivado.sucursal_fk = validated_data.get('sucursal_fk')
            producto_desactivado.save()
            
            # Actualizar o crear el stock
            stock_data = validated_data.pop('stock', 0)
            stock_minimo_data = validated_data.pop('stock_minimo', 5)
            stock_maximo_data = validated_data.pop('stock_maximo', 100)
            
            stock_obj, created = Stock.objects.get_or_create(
                productos_fk=producto_desactivado,
                bodega_fk=producto_desactivado.bodega_fk.id_bdg if producto_desactivado.bodega_fk else None,
                sucursal_fk=producto_desactivado.sucursal_fk.id if producto_desactivado.sucursal_fk else None,
                defaults={
                    'stock': stock_data,
                    'stock_minimo': stock_minimo_data,
                    'stock_maximo': stock_maximo_data,
                    'proveedor_fk': None
                }
            )
            
            if not created:
                stock_obj.stock = stock_data
                stock_obj.stock_minimo = stock_minimo_data
                stock_obj.stock_maximo = stock_maximo_data
                stock_obj.save()
            
            return producto_desactivado
        
        # Si no hay producto desactivado, verificar que no exista uno activo
        if Productos.objects.filter(nombre_prodc=nombre, activo=True).exists():
            raise serializers.ValidationError({'nombre_prodc': 'Ya existe un producto activo con este nombre.'})
        if Productos.objects.filter(codigo_interno=codigo, activo=True).exists():
            raise serializers.ValidationError({'codigo_interno': 'Ya existe un producto activo con este código.'})
        # Generar código automáticamente si no se provee
        if not codigo:
            # Ejemplo: usar prefijo de categoría, marca y un contador
            categoria = validated_data.get('categoria_fk')
            marca = validated_data.get('marca_fk')
            fecha = timezone.now().strftime('%Y%m')
            prefijo_cat = str(categoria.id) if categoria else 'GEN'
            prefijo_marca = str(marca.id_mprod) if marca else 'GEN'
            contador = Productos.objects.filter(activo=True).count() + 1
            codigo = f"PROD-{prefijo_cat}-{prefijo_marca}-{fecha}-{contador:03d}"
            # Asegurar unicidad (solo productos activos)
            while Productos.objects.filter(codigo_interno=codigo, activo=True).exists():
                contador += 1
                codigo = f"PROD-{prefijo_cat}-{prefijo_marca}-{fecha}-{contador:03d}"
            validated_data['codigo_interno'] = codigo
        stock_data = validated_data.pop('stock', 0)
        stock_minimo_data = validated_data.pop('stock_minimo', 5)
        stock_maximo_data = validated_data.pop('stock_maximo', 100)
        validated_data['fecha_creacion'] = timezone.now()
        producto = Productos.objects.create(**validated_data)
        # Crear el registro de stock
        Stock.objects.create(
            productos_fk=producto,
            stock=stock_data,
            stock_minimo=stock_minimo_data,
            stock_maximo=stock_maximo_data,
            bodega_fk=producto.bodega_fk.id_bdg if producto.bodega_fk else None,
            sucursal_fk=producto.sucursal_fk.id if producto.sucursal_fk else None,
            proveedor_fk=None
        )
        return producto

    def update(self, instance, validated_data):
        stock_data = validated_data.pop('stock', None)
        stock_minimo_data = validated_data.pop('stock_minimo', None)
        stock_maximo_data = validated_data.pop('stock_maximo', None)
        motivo = validated_data.pop('motivo', None)  # Extraer el motivo pero no pasarlo al modelo
        # Guardar el motivo en el contexto para que la vista pueda acceder a él
        if motivo:
            self.context['motivo'] = motivo
        # Actualiza los campos del producto principal
        instance = super().update(instance, validated_data)
        # Si se envió un nuevo stock, stock mínimo o stock máximo, actualiza la tabla Stock
        if stock_data is not None or stock_minimo_data is not None or stock_maximo_data is not None:
            # Determinar si es bodega o sucursal
            if instance.bodega_fk:
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=instance,
                    bodega_fk=instance.bodega_fk.id_bdg,
                    defaults={
                        'stock': 0,
                        'stock_minimo': 5,
                        'stock_maximo': 100,
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
                        'stock_maximo': 100,
                        'bodega_fk': None,
                        'proveedor_fk': None
                    }
                )
            else:
                return instance
            if stock_data is not None:
                stock_obj.stock = stock_data
            if stock_minimo_data is not None:
                stock_obj.stock_minimo = stock_minimo_data
            if stock_maximo_data is not None:
                stock_obj.stock_maximo = stock_maximo_data
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

# --- SERIALIZER PARA PRODUCTOS EN BODEGA ---
class ProductoBodegaSerializer(serializers.ModelSerializer):
    fecha_creacion = serializers.DateTimeField(format=None)
    stock = serializers.SerializerMethodField()
    marca_nombre = serializers.CharField(source='marca_fk.nombre_mprod', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria_fk.nombre', read_only=True)
    
    # Hacer la descripción opcional
    descripcion_prodc = serializers.CharField(required=False, allow_blank=True)



    class Meta:
        model = Productos
        fields = [
            'id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
            'marca_fk', 'marca_nombre', 'categoria_fk', 'categoria_nombre', 'bodega_fk', 'stock', 'fecha_creacion'
        ]

    def get_stock(self, obj):
        stock_obj = Stock.objects.filter(
            productos_fk=obj,
            bodega_fk=obj.bodega_fk.id_bdg if obj.bodega_fk else None
        ).first()
        return float(stock_obj.stock) if stock_obj else 0

# --- SERIALIZER PARA PRODUCTOS EN SUCURSAL ---
class ProductoSucursalSerializer(serializers.ModelSerializer):
    fecha_creacion = serializers.DateTimeField(format=None)
    stock = serializers.SerializerMethodField()
    marca_nombre = serializers.CharField(source='marca_fk.nombre_mprod', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria_fk.nombre', read_only=True)
    
    # Hacer la descripción opcional
    descripcion_prodc = serializers.CharField(required=False, allow_blank=True)


    class Meta:
        model = Productos
        fields = [
            'id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
            'marca_fk', 'marca_nombre', 'categoria_fk', 'categoria_nombre', 'sucursal_fk', 'stock', 'fecha_creacion'
        ]

    def get_stock(self, obj):
        request = self.context.get('request')
        sucursal_id = None
        if request:
            sucursal_id = request.query_params.get('sucursal_id') if hasattr(request, 'query_params') else None
            if (not sucursal_id or sucursal_id == '') and hasattr(request, 'data'):
                sucursal_id = request.data.get('sucursal_id')
        if sucursal_id:
            stock_obj = Stock.objects.filter(
                productos_fk=obj,
                sucursal_fk=sucursal_id
            ).first()
        elif obj.sucursal_fk:
            stock_obj = Stock.objects.filter(
                productos_fk=obj,
                sucursal_fk=obj.sucursal_fk.id
            ).first()
        else:
            stock_obj = None
        return float(stock_obj.stock) if stock_obj else 0

class HistorialEstadoPedidoSerializer(serializers.ModelSerializer):
    fecha = serializers.DateTimeField(format=None)
    estado_anterior_obj = EstadoPedidoSerializer(source='estado_anterior', read_only=True)
    estado_nuevo_obj = EstadoPedidoSerializer(source='estado_nuevo', read_only=True)
    usuario_obj = UsuarioSerializer(source='usuario_fk', read_only=True)
    estado_anterior_nombre = serializers.CharField(source='estado_anterior.nombre', read_only=True)
    estado_nuevo_nombre = serializers.CharField(source='estado_nuevo.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)

    class Meta:
        model = HistorialEstadoPedido
        fields = [
            'id_hist_ped', 'pedido_fk',
            'estado_anterior', 'estado_anterior_nombre', 'estado_anterior_obj',
            'estado_nuevo', 'estado_nuevo_nombre', 'estado_nuevo_obj',
            'usuario_fk', 'usuario_nombre', 'usuario_obj',
            'fecha', 'comentario'
        ]
        read_only_fields = ['id_hist_ped', 'fecha']


class HistorialPedidosDetalladoSerializer(serializers.ModelSerializer):
    fecha = serializers.DateTimeField(format=None)
    fecha_entrega = serializers.DateTimeField(source='pedidos_fk.fecha_entrega', format=None, read_only=True)
    # Campos directos
    id = serializers.IntegerField(source='id_hst', read_only=True)
    producto_id = serializers.IntegerField(source='producto_fk.id_prodc', read_only=True)
    producto_nombre = serializers.CharField(source='producto_fk.nombre_prodc', read_only=True)
    usuario_id = serializers.IntegerField(source='usuario_fk.id_us', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario_fk.nombre', read_only=True)
    # Contexto del pedido
    pedido_id = serializers.IntegerField(source='pedidos_fk.id_p', read_only=True)
    sucursal_id = serializers.SerializerMethodField()
    sucursal_nombre = serializers.SerializerMethodField()
    proveedor_id = serializers.SerializerMethodField()
    proveedor_nombre = serializers.SerializerMethodField()
    estado_nombre = serializers.CharField(source='pedidos_fk.estado_pedido_fk.nombre', read_only=True)
    tipo = serializers.SerializerMethodField()
    cantidad = serializers.SerializerMethodField()

    class Meta:
        model = Historial
        fields = [
            'id', 'fecha', 'producto_id', 'producto_nombre',
            'usuario_id', 'usuario_nombre',
            'pedido_id', 'fecha_entrega',
            'sucursal_id', 'sucursal_nombre',
            'proveedor_id', 'proveedor_nombre',
            'estado_nombre', 'tipo', 'cantidad'
        ]

    def get_sucursal_id(self, obj):
        suc = getattr(obj.pedidos_fk, 'sucursal_fk', None)
        return suc.id if suc else None

    def get_sucursal_nombre(self, obj):
        suc = getattr(obj.pedidos_fk, 'sucursal_fk', None)
        return suc.nombre_sucursal if suc else None

    def get_proveedor_id(self, obj):
        prov = getattr(obj.pedidos_fk, 'proveedor_fk', None)
        return prov.id_provd if prov else None

    def get_proveedor_nombre(self, obj):
        prov = getattr(obj.pedidos_fk, 'proveedor_fk', None)
        return prov.nombres_provd if prov else None

    def get_tipo(self, obj):
        pedido = getattr(obj, 'pedidos_fk', None)
        if not pedido:
            return None
        if getattr(pedido, 'proveedor_fk', None):
            return "ingreso"
        elif getattr(pedido, 'sucursal_fk', None):
            return "salida"
        return "otro"

    def get_cantidad(self, obj):
        DetallePedido = self.Meta.model._meta.apps.get_model('api', 'DetallePedido')
        pedido = getattr(obj, 'pedidos_fk', None)
        producto = getattr(obj, 'producto_fk', None)
        if not pedido or not producto:
            return None
        detalle = DetallePedido.objects.filter(pedidos_fk=pedido, productos_pedido_fk=producto).first()
        return detalle.cantidad if detalle else None

    def clean_codigo_interno(self, codigo):
        """
        Limpia el código interno eliminando caracteres problemáticos (comillas, espacios, símbolos raros)
        y lo deja en un formato seguro para la base de datos y búsquedas.
        """
        if not codigo:
            return codigo
        # Reemplazar comillas dobles y simples, espacios y caracteres no alfanuméricos (excepto guion y guion bajo)
        codigo = re.sub(r'["\'\s]+', '-', codigo)
        codigo = re.sub(r'[^A-Za-z0-9\-_]', '', codigo)
        return codigo.upper()
