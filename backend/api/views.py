from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario, Rol, BodegaCentral, Sucursal, Productos, Marca, Categoria, Solicitudes,Pedidos,PersonalEntrega,DetallePedido,EstadoPedido
from .serializers import LoginSerializer, RegisterSerializer, ProductoSerializer, MarcaSerializer, CategoriaSerializer, SolicitudesSerializer, SolicitudesCreateSerializer, PedidosSerializer,PersonalEntregaSerializer,DetallePedidoSerializer,EstadoPedidoSerializer
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import viewsets
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        correo = serializer.validated_data['correo']
        contrasena = serializer.validated_data['contrasena']
        
        try:
            usuario = Usuario.objects.get(correo=correo)
            if usuario.check_password(contrasena):
                # Generar tokens
                refresh = RefreshToken.for_user(usuario)
                
                return Response({
                    'usuario': {
                        'id': usuario.id_us,
                        'nombre': usuario.nombre,
                        'correo': usuario.correo,
                        'rol': usuario.rol_fk.nombre_rol,
                        'bodega': usuario.bodeg_fk.id_bdg if usuario.bodeg_fk else None,
                        'sucursal': usuario.sucursal_fk.id if usuario.sucursal_fk else None
                    },
                    'token': str(refresh.access_token),
                    'refresh': str(refresh)
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
                    'rol': usuario.rol_fk.nombre_rol,
                    'bodega': usuario.bodeg_fk.id_bdg if usuario.bodeg_fk else None,
                    'sucursal': usuario.sucursal_fk.id if usuario.sucursal_fk else None
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("Error en registro:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    print("Errores de validación:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Productos.objects.all()
    serializer_class = ProductoSerializer
    lookup_field = 'id_prodc'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Productos.objects.all()
        bodega_id = self.request.query_params.get('bodega_id')
        sucursal_id = self.request.query_params.get('sucursal_id')
        
        logger.info(f"DEBUG - Parámetros recibidos: bodega_id={bodega_id}, sucursal_id={sucursal_id}")
        logger.info(f"DEBUG - Productos totales: {queryset.count()}")
        
        if bodega_id:
            queryset = queryset.filter(bodega_fk=bodega_id)
            logger.info(f"DEBUG - Productos filtrados por bodega {bodega_id}: {queryset.count()}")
        if sucursal_id:
            queryset = queryset.filter(sucursal_fk=sucursal_id)
            logger.info(f"DEBUG - Productos filtrados por sucursal {sucursal_id}: {queryset.count()}")
            
        logger.info(f"DEBUG - Productos finales a devolver: {queryset.count()}")
        return queryset

    def perform_create(self, serializer):
        if not (self.request.data.get('bodega_fk') or self.request.data.get('sucursal_fk')):
            raise serializers.ValidationError(
                "Se requiere especificar bodega_fk o sucursal_fk"
            )
        serializer.save()

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creando producto con datos: {request.data}")
            logger.info(f"Tipo de marca_fk: {type(request.data.get('marca_fk'))}, valor: {request.data.get('marca_fk')}")
            logger.info(f"Tipo de categoria_fk: {type(request.data.get('categoria_fk'))}, valor: {request.data.get('categoria_fk')}")
            logger.info(f"Stock recibido: {request.data.get('stock')}, tipo: {type(request.data.get('stock'))}")
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            logger.info(f"Datos validados: {serializer.validated_data}")
            
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            logger.error(f"Error de validación al crear producto: {str(e)}")
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error al crear producto: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            logger.info(f"Actualizando producto {kwargs.get('id_prodc')} con datos: {request.data}")
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Productos.DoesNotExist:
            logger.error(f"Producto {kwargs.get('id_prodc')} no encontrado")
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except serializers.ValidationError as e:
            logger.error(f"Error de validación al actualizar producto: {str(e)}")
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error al actualizar producto: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            logger.info(f"Eliminando producto {kwargs.get('id_prodc')}")
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Productos.DoesNotExist:
            logger.error(f"Producto {kwargs.get('id_prodc')} no encontrado")
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al eliminar producto: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

    @api_view(['DELETE'])
    @permission_classes([IsAuthenticated])
    def eliminar_categoria(request):
        if request.method != 'DELETE':
            return Response(
                {'error': 'Método no permitido'},
                status=status.HTTP_405_METHOD_NOT_ALLOWED
            )
        
        if not request.user.is_authenticated:
            return Response(
                {'error': 'No autorizado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            categoria_id = request.query_params.get('id')
            if not categoria_id:
                return Response(
                    {'error': 'El ID de la categoría es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                categoria_id = int(categoria_id)
            except ValueError:
                return Response(
                    {'error': 'El ID de la categoría debe ser un número'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                categoria = Categoria.objects.get(id=categoria_id)
            except Categoria.DoesNotExist:
                return Response(
                    {'error': f'No existe una categoría con el ID {categoria_id}'},
                    status=status.HTTP_404_NOT_FOUND
                )

            categoria.delete()
            return Response(
                {'mensaje': f'Categoría {categoria_id} eliminada exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar la categoría: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @api_view(['DELETE'])
    @permission_classes([IsAuthenticated])
    def eliminar_marca(request):
        if request.method != 'DELETE':
            return Response(
                {'error': 'Método no permitido'},
                status=status.HTTP_405_METHOD_NOT_ALLOWED
            )
        
        if not request.user.is_authenticated:
            return Response(
                {'error': 'No autorizado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            marca_id = request.query_params.get('id_mprod')
            if not marca_id:
                return Response(
                    {'error': 'El ID de la marca es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                marca_id = int(marca_id)
            except ValueError:
                return Response(
                    {'error': 'El ID de la marca debe ser un número'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                marca = Marca.objects.get(id_mprod=marca_id)
            except Marca.DoesNotExist:
                return Response(
                    {'error': f'No existe una marca con el ID {marca_id}'},
                    status=status.HTTP_404_NOT_FOUND
                )

            marca.delete()
            return Response(
                {'mensaje': f'Marca {marca_id} eliminada exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar la marca: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    lookup_field = 'id_mprod'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear marca: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error al actualizar marca: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(
                {'mensaje': f'Marca {instance.id_mprod} eliminada exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error al eliminar marca: {str(e)}")
            return Response(
                {'error': f'Error al eliminar la marca: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    lookup_field = 'id'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear categoría: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error al actualizar categoría: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(
                {'mensaje': f'Categoría {instance.id} eliminada exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error al eliminar categoría: {str(e)}")
            return Response(
                {'error': f'Error al eliminar la categoría: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class SolicitudesViewSet(viewsets.ModelViewSet):
    queryset = Solicitudes.objects.all()
    serializer_class = SolicitudesSerializer
    lookup_field = 'id_solc'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitudesCreateSerializer
        return SolicitudesSerializer

    def get_queryset(self):
        queryset = Solicitudes.objects.all()
        bodega_id = self.request.query_params.get('bodega_id')
        sucursal_id = self.request.query_params.get('sucursal_id')
        
        logger.info(f"DEBUG - SolicitudesViewSet: Parámetros recibidos - bodega_id={bodega_id}, sucursal_id={sucursal_id}")
        
        if bodega_id:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por bodega_id={bodega_id}")
            queryset = queryset.filter(fk_bodega=bodega_id)
        if sucursal_id:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por sucursal_id={sucursal_id}")
            queryset = queryset.filter(fk_sucursal=sucursal_id)
        
        logger.info(f"DEBUG - SolicitudesViewSet: Total de solicitudes encontradas: {queryset.count()}")
        return queryset.order_by('-fecha_creacion')

    def perform_create(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        try:
            logger.info(f"Actualizando solicitud {kwargs.get('id_solc')} con datos: {request.data}")
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            self.perform_update(serializer)
            return Response(serializer.data)
        except Solicitudes.DoesNotExist:
            logger.error(f"Solicitud {kwargs.get('id_solc')} no encontrada")
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except serializers.ValidationError as e:
            logger.error(f"Error de validación al actualizar solicitud: {str(e)}")
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error al actualizar solicitud: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class PedidosViewSet(viewsets.ModelViewSet):
    queryset = Pedidos.objects.all()
    serializer_class=PedidosSerializer
    lookup_field = 'id_p'
    authentication_classes=[JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list','retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    def get_serializer_class(self):
        if self.action == 'create':
            return PedidosSerializer
        return PedidosSerializer
    
    def get_queryset(self):
        queryset = Pedidos.objects.all()
        id_psn = self.request.query_params.get('id_psn')
        sucursal_id = self.request.query_params.get('sucursal_id')
        id_estped = self.request.query_params.get('id_estped')
        solicitud_id = self.request.query_params.get('solicitud_id')
        bodega_id = self.request.query_params.get('bodega_id')
        proveedor_id= self.request.query_params.get('proveedor_id')

        logger.info(f"DEBUG-PedidosViewSet: parametros recibidos - id_psn={id_psn},sucursal_id={sucursal_id},id_estped={id_estped},solicitud_id={solicitud_id},bodega_id={bodega_id},proveedor_id={proveedor_id}")

        if id_psn:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por id_psn={id_psn}")
            queryset = queryset.filter (personal_entrega_fk_id=id_psn)
        if sucursal_id:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por sucursal_id={sucursal_id}")
            queryset = queryset.filter (sucursal_fk_id=sucursal_id)
        if id_estped:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por id_estped={id_estped}")
            queryset = queryset.filter (estado_pedido_fk_id=id_estped)
        if solicitud_id:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por solicitud_id={solicitud_id}")
            queryset = queryset.filter (solicitud_fk_id=solicitud_id)
        if bodega_id:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por bodega_id={bodega_id}")
            queryset = queryset.filter (bodega_fk_id=bodega_id)
        if proveedor_id:
            logger.info(f"DEBUG - SolicitudesViewSet: Filtrando por proveedor_id={proveedor_id}")
            queryset = queryset.filter (proveedor_fk_id=proveedor_id)

        logger.info(f"DEBUG - PedidosViewSet: total pedidos encontradas:{queryset.count()}")
        return queryset.order_by('-id_p')

    def perform_create(self,serializer): 
        serializer.save()