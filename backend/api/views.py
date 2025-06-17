from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario, Rol, BodegaCentral, Sucursal, Productos, Marca, Categoria
from .serializers import LoginSerializer, RegisterSerializer, ProductoSerializer, MarcaSerializer, CategoriaSerializer
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import viewsets
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework import serializers

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        correo = serializer.validated_data['correo']
        contrasena = serializer.validated_data['contrasena']
        
        try:
            usuario = Usuario.objects.get(correo=correo)
            if check_password(contrasena, usuario.contrasena):
                return Response({
                    'usuario': {
                        'id': usuario.id_us,
                        'nombre': usuario.nombre,
                        'correo': usuario.correo,
                        'rol': usuario.rol_fk.nombre_rol,
                        'bodega': usuario.bodeg_fk.id_bdg if usuario.bodeg_fk else None,
                        'sucursal': usuario.sucursal_fk.id if usuario.sucursal_fk else None
                    }
                })
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):
    print("Datos recibidos:", request.data)
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Obtener o crear el rol usando nombre_rol en lugar de nombre
            rol, _ = Rol.objects.get_or_create(nombre_rol=serializer.validated_data['rol'])
            
            # Obtener bodega o sucursal según corresponda
            bodega = None
            sucursal = None
            if serializer.validated_data.get('bodega'):
                bodega = BodegaCentral.objects.get(id_bdg=serializer.validated_data['bodega'])
            if serializer.validated_data.get('sucursal'):
                sucursal = Sucursal.objects.get(id=serializer.validated_data['sucursal'])
            
            # Crear usuario
            usuario = Usuario.objects.create(
                nombre=serializer.validated_data['nombre'],
                correo=serializer.validated_data['correo'],
                contrasena=make_password(serializer.validated_data['contrasena']),
                rut=serializer.validated_data['rut'],
                rol_fk=rol,
                bodeg_fk=bodega,
                sucursal_fk=sucursal
            )
            
            return Response({
                'usuario': {
                    'id': usuario.id_us,
                    'nombre': usuario.nombre,
                    'correo': usuario.correo,
                    'rol': usuario.rol_fk.nombre_rol,  # Cambiado de nombre a nombre_rol
                    'bodega': usuario.bodeg_fk.id_bdg if usuario.bodeg_fk else None,  # Cambiado de id a id_bdg
                    'sucursal': usuario.sucursal_fk.id if usuario.sucursal_fk else None
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("Error en registro:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    print("Errores de validación:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Productos.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 
                          'agregar_marca', 'agregar_categoria', 
                          'eliminar_marca', 'eliminar_categoria']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        bodega_id = self.request.query_params.get('bodega_id')
        sucursal_id = self.request.query_params.get('sucursal_id')
        
        queryset = Productos.objects.all()
        
        if bodega_id:
            queryset = queryset.filter(bodega_fk=bodega_id)
        elif sucursal_id:
            queryset = queryset.filter(sucursal_fk=sucursal_id)
            
        return queryset

    def perform_create(self, serializer):
        bodega_id = self.request.data.get('bodega_fk')
        sucursal_id = self.request.data.get('sucursal_fk')
        
        if not bodega_id and not sucursal_id:
            raise serializers.ValidationError("Se requiere bodega_fk o sucursal_fk")
            
        serializer.save(fecha_creacion=timezone.now())

    @action(detail=False, methods=['get'])
    def marcas(self, request):
        marcas = Marca.objects.all()
        serializer = MarcaSerializer(marcas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categorias(self, request):
        categorias = Categoria.objects.all()
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def agregar_marca(self, request):
        serializer = MarcaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def agregar_categoria(self, request):
        serializer = CategoriaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def eliminar_marca(self, request):
        marca_id = request.query_params.get('id_mprod')
        if not marca_id:
            return Response({'error': 'id_mprod es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            marca = Marca.objects.get(id_mprod=marca_id)
            marca.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Marca.DoesNotExist:
            return Response({'error': 'Marca no encontrada'}, 
                          status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['delete'])
    def eliminar_categoria(self, request):
        categoria_id = request.query_params.get('id')
        if not categoria_id:
            return Response({'error': 'id es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            categoria = Categoria.objects.get(id=categoria_id)
            categoria.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Categoria.DoesNotExist:
            return Response({'error': 'Categoría no encontrada'}, 
                          status=status.HTTP_404_NOT_FOUND)