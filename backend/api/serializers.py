from rest_framework import serializers
from .models import (
    BodegaCentral, Categoria, DetallePedido, EstadoPedido, Historial, Informe,
    Marca, Modulos, MovInventario, Notificacion, Pedidos, Permisos,
    PersonalEntrega, Productos, Proveedor, Rol, Solicitudes, Stock, Sucursal, Usuario
)

class BodegaCentralSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodegaCentral
        fields = ['id_bdg', 'nombre_bdg', 'direccion', 'rut']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']

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
    class Meta:
        model = Pedidos
        fields = '__all__'

class PermisosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permisos
        fields = '__all__'

class PersonalEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalEntrega
        fields = '__all__'

class ProductosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = '__all__'

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class SolicitudesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitudes
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = ['id', 'nombre_sucursal', 'direccion', 'descripcion', 'bodega_fk', 'rut']

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

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

class ProductoSerializer(serializers.ModelSerializer):
    marca_nombre = serializers.CharField(source='marca_fk.nombre_mprod', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria_fk.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega_fk.nombre_bdg', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal_fk.nombre_suc', read_only=True)

    class Meta:
        model = Productos
        fields = ['id_prodc', 'nombre_prodc', 'descripcion_prodc', 'codigo_interno',
                 'fecha_creacion', 'marca_fk', 'marca_nombre', 'categoria_fk',
                 'categoria_nombre', 'bodega_fk', 'bodega_nombre', 'sucursal_fk',
                 'sucursal_nombre']
    