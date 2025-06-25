from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario, Rol, BodegaCentral, Sucursal, Productos, Marca, Categoria, Solicitudes,Pedidos,PersonalEntrega,DetallePedido,EstadoPedido, Informe, SolicitudProductos, Pedidos, DetallePedido, Notificacion, Historial, Stock, EstadoPedido, PersonalEntrega, MovInventario, Proveedor
from .serializers import LoginSerializer, RegisterSerializer, ProductoSerializer, MarcaSerializer, CategoriaSerializer, SolicitudesSerializer, SolicitudesCreateSerializer, PedidosSerializer,PersonalEntregaSerializer,DetallePedidoSerializer,EstadoPedidoSerializer, UsuarioSerializer, InformeSerializer, InformeCreateSerializer, PedidosSerializer, PedidosCreateSerializer, PersonalEntregaSerializer, ProveedorSerializer
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import viewsets
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework import serializers
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
import json
import pdfplumber
import re

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
            # Filtrar productos que tienen stock en la bodega
            productos_con_stock = Stock.objects.filter(
                bodega_fk=bodega_id,
                stock__gt=0
            ).values_list('productos_fk', flat=True)
            queryset = queryset.filter(id_prodc__in=productos_con_stock)
            logger.info(f"DEBUG - Productos filtrados por bodega {bodega_id}: {queryset.count()}")
        elif sucursal_id:
            # Filtrar productos que tienen stock en la sucursal
            productos_con_stock = Stock.objects.filter(
                sucursal_fk=sucursal_id,
                stock__gt=0
            ).values_list('productos_fk', flat=True)
            queryset = queryset.filter(id_prodc__in=productos_con_stock)
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

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creando solicitud con datos: {request.data}")
            logger.info(f"Usuario autenticado: {request.user}")
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Datos validados: {serializer.validated_data}")
            self.perform_create(serializer)
            logger.info(f"Solicitud creada exitosamente: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear solicitud: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Detectar si hay cambio de estado (deberías tener un campo 'estado' o similar)
            estado_anterior = getattr(instance, 'estado', None)
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            estado_nuevo = serializer.validated_data.get('estado', None)
            # Si la solicitud pasa a 'aprobada' y antes no lo estaba, descuenta stock
            if estado_nuevo == 'aprobada' and estado_anterior != 'aprobada':
                productos_solicitados = SolicitudProductos.objects.filter(solicitud_fk=instance)
                for prod in productos_solicitados:
                    stock_obj = Stock.objects.get(productos_fk=prod.producto_fk, bodega_fk=instance.fk_bodega.id_bdg)
                    if stock_obj.stock < prod.cantidad:
                        raise serializers.ValidationError(f"Stock insuficiente para el producto {prod.producto_fk.nombre_prodc}")
                    stock_obj.stock -= prod.cantidad
                    stock_obj.save()
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

    @action(detail=False, methods=['post'], url_path='archivar-solicitudes')
    def archivar_solicitudes(self, request):
        """
        Archiva una lista de solicitudes marcando su campo despachada como True.
        Espera una lista de IDs en el cuerpo de la petición: {'ids': [1, 2, 3]}
        """
        solicitud_ids = request.data.get('ids', [])
        if not solicitud_ids:
            return Response({'error': 'No se proporcionaron IDs de solicitudes'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            solicitudes_a_archivar = Solicitudes.objects.filter(id_solc__in=solicitud_ids)
            count = solicitudes_a_archivar.update(despachada=True)
            return Response({'mensaje': f'{count} solicitudes archivadas exitosamente.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        try:
            logger.info(f"Eliminando solicitud {kwargs.get('id_solc')} y sus derivados")
            instance = self.get_object()
            
            # Obtener información antes de eliminar para el log
            solicitud_id = instance.id_solc
            sucursal_nombre = instance.fk_sucursal.nombre_sucursal if instance.fk_sucursal else 'N/A'
            usuario_nombre = instance.usuarios_fk.nombre if instance.usuarios_fk else 'N/A'
            
            # Eliminar informes relacionados con esta solicitud
            informes_eliminados = 0
            try:
                # Buscar informes que contengan el ID de la solicitud en el contenido JSON
                informes_relacionados = Informe.objects.filter(
                    modulo_origen='solicitudes'
                )
                
                for informe in informes_relacionados:
                    try:
                        contenido = json.loads(informe.contenido)
                        if contenido.get('solicitud_id') == solicitud_id:
                            informe.delete()
                            informes_eliminados += 1
                            logger.info(f"Informe {informe.id_informe} eliminado")
                    except (json.JSONDecodeError, KeyError):
                        # Si el contenido no es JSON válido o no tiene solicitud_id, continuar
                        continue
                        
            except Exception as e:
                logger.warning(f"Error al eliminar informes relacionados: {str(e)}")
            
            # Eliminar la solicitud (esto activará la eliminación en cascada automática)
            self.perform_destroy(instance)
            
            logger.info(f"Solicitud {solicitud_id} eliminada exitosamente")
            logger.info(f"  - Sucursal: {sucursal_nombre}")
            logger.info(f"  - Usuario: {usuario_nombre}")
            logger.info(f"  - Informes eliminados: {informes_eliminados}")
            
            return Response({
                'mensaje': f'Solicitud {solicitud_id} eliminada exitosamente junto con todos sus derivados y {informes_eliminados} informes relacionados',
                'solicitud_id': solicitud_id,
                'informes_eliminados': informes_eliminados
            }, status=status.HTTP_200_OK)
            
        except Solicitudes.DoesNotExist:
            logger.error(f"Solicitud {kwargs.get('id_solc')} no encontrada")
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al eliminar solicitud: {str(e)}")
            return Response({'error': f'Error al eliminar la solicitud: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='transportistas-bodega/(?P<bodega_id>[^/.]+)')
    def transportistas_bodega(self, request, bodega_id=None):
        """
        Devuelve una lista de usuarios que tienen el rol de 'transportista'
        y están asociados a una bodega específica.
        """
        try:
            transportistas = Usuario.objects.filter(
                rol_fk__nombre_rol='transportista',
                bodeg_fk__id_bdg=bodega_id
            )
            serializer = self.get_serializer(transportistas, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class InformeViewSet(viewsets.ModelViewSet):
    queryset = Informe.objects.all()
    serializer_class = InformeSerializer
    lookup_field = 'id_informe'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return InformeCreateSerializer
        return InformeSerializer

    def get_queryset(self):
        queryset = Informe.objects.all()
        modulo_origen = self.request.query_params.get('modulo_origen')
        usuario_fk = self.request.query_params.get('usuario_fk')
        bodega_fk = self.request.query_params.get('bodega_fk')
        sucursal_fk = self.request.query_params.get('sucursal_fk')
        
        logger.info(f"🔍 DEBUG - InformeViewSet.get_queryset - Parámetros recibidos:")
        logger.info(f"  - modulo_origen: {modulo_origen}")
        logger.info(f"  - usuario_fk: {usuario_fk}")
        logger.info(f"  - Informes totales antes de filtros: {queryset.count()}")
        
        if modulo_origen:
            queryset = queryset.filter(modulo_origen=modulo_origen)
            logger.info(f"  - Informes después de filtro módulo: {queryset.count()}")
        if usuario_fk:
            queryset = queryset.filter(usuario_fk=usuario_fk)
            logger.info(f"  - Informes después de filtro usuario: {queryset.count()}")
        if bodega_fk:
            queryset = queryset.filter(bodega_fk=bodega_fk)
        if sucursal_fk:
            queryset = queryset.filter(sucursal_fk=sucursal_fk)

        logger.info(f"  - Informes finales a devolver: {queryset.count()}")
        
        return queryset.order_by('-fecha_generado')

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creando informe con datos: {request.data}")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear informe: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def limpiar_huérfanos(self, request):
        """Elimina informes de solicitudes que ya no existen"""
        try:
            logger.info("Iniciando limpieza de informes huérfanos")
            
            # Obtener todos los informes de solicitudes
            informes_solicitudes = Informe.objects.filter(modulo_origen='solicitudes')
            
            informes_eliminados = 0
            solicitudes_no_encontradas = []
            
            for informe in informes_solicitudes:
                try:
                    contenido = json.loads(informe.contenido)
                    solicitud_id = contenido.get('solicitud_id')
                    
                    if solicitud_id:
                        # Verificar si la solicitud existe
                        solicitud_existe = Solicitudes.objects.filter(id_solc=solicitud_id).exists()
                        
                        if not solicitud_existe:
                            # La solicitud no existe, eliminar el informe
                            informe.delete()
                            informes_eliminados += 1
                            solicitudes_no_encontradas.append(solicitud_id)
                            logger.info(f"Informe {informe.id_informe} eliminado - solicitud {solicitud_id} no existe")
                            
                except (json.JSONDecodeError, KeyError) as e:
                    # Si el contenido no es JSON válido, eliminar el informe
                    informe.delete()
                    informes_eliminados += 1
                    logger.info(f"Informe {informe.id_informe} eliminado - contenido JSON inválido")
                    
            logger.info(f"Limpieza completada: {informes_eliminados} informes eliminados")
            
            return Response({
                'mensaje': f'Limpieza completada. {informes_eliminados} informes huérfanos eliminados.',
                'informes_eliminados': informes_eliminados,
                'solicitudes_no_encontradas': solicitudes_no_encontradas
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error en limpieza de informes huérfanos: {str(e)}")
            return Response({'error': f'Error en la limpieza: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class PedidosViewSet(viewsets.ModelViewSet):
    queryset = Pedidos.objects.all()
    serializer_class = PedidosSerializer
    lookup_field = 'id_p'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return PedidosCreateSerializer
        return PedidosSerializer

    def get_queryset(self):
        queryset = Pedidos.objects.all()
        bodega_id = self.request.query_params.get('bodega_id')
        sucursal_id = self.request.query_params.get('sucursal_id')
        estado = self.request.query_params.get('estado')
        
        logger.info(f"DEBUG - PedidosViewSet.get_queryset - Parámetros recibidos:")
        logger.info(f"  - bodega_id: {bodega_id}")
        logger.info(f"  - sucursal_id: {sucursal_id}")
        logger.info(f"  - estado: {estado}")
        logger.info(f"  - Pedidos totales antes de filtros: {queryset.count()}")
        
        if bodega_id:
            queryset = queryset.filter(bodega_fk=bodega_id)
            logger.info(f"  - Pedidos después de filtro bodega: {queryset.count()}")
        if sucursal_id:
            queryset = queryset.filter(sucursal_fk=sucursal_id)
            logger.info(f"  - Pedidos después de filtro sucursal: {queryset.count()}")
        if estado:
            queryset = queryset.filter(estado_pedido_fk__nombre=estado)
            logger.info(f"  - Pedidos después de filtro estado: {queryset.count()}")
        
        logger.info(f"  - Pedidos finales a devolver: {queryset.count()}")
        
        return queryset.order_by('-fecha_entrega')

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creando pedido con datos: {request.data}")
            # Validación: evitar duplicados por solicitud
            solicitud_id = request.data.get('solicitud_fk')
            if solicitud_id and Pedidos.objects.filter(solicitud_fk=solicitud_id).exists():
                return Response({'error': 'Ya existe un pedido para esta solicitud.'}, status=status.HTTP_400_BAD_REQUEST)
            # Validación: evitar pedidos sin productos
            productos = request.data.get('productos', [])
            if not productos:
                return Response({'error': 'No se puede crear un pedido sin productos.'}, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear pedido: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            estado_anterior = instance.estado_pedido_fk.nombre if instance.estado_pedido_fk else None
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # Lógica para manejar cambios de estado
            estado_nuevo = serializer.validated_data.get('estado_pedido_fk', None)
            if estado_nuevo and hasattr(estado_nuevo, 'nombre') and estado_nuevo.nombre == 'aprobado' and estado_anterior != 'aprobado':
                detalles = DetallePedido.objects.filter(pedidos_fk=instance)
                for detalle in detalles:
                    stock_obj, created = Stock.objects.get_or_create(
                        productos_fk=detalle.productos_pedido_fk,
                        bodega_fk=instance.bodega_fk.id_bdg
                    )
                    stock_obj.stock += detalle.cantidad
                    stock_obj.save()
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error al actualizar pedido: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='crear-desde-solicitud')
    def crear_desde_solicitud(self, request):
        """
        Crea un pedido a partir de una solicitud despachada
        """
        try:
            solicitud_id = request.data.get('solicitud_id')
            personal_entrega_id = request.data.get('personal_entrega_id')
            descripcion = request.data.get('descripcion', 'Pedido generado desde solicitud')
            if not solicitud_id:
                return Response({'error': 'solicitud_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            if not personal_entrega_id:
                return Response({'error': 'personal_entrega_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            # Validación: evitar duplicados por solicitud
            if Pedidos.objects.filter(solicitud_fk=solicitud_id).exists():
                return Response({'error': 'Ya existe un pedido para esta solicitud.'}, status=status.HTTP_400_BAD_REQUEST)
            # Obtener la solicitud
            solicitud = Solicitudes.objects.get(id_solc=solicitud_id)
            # Validación: evitar pedidos sin productos
            solicitud_productos = SolicitudProductos.objects.filter(solicitud_fk=solicitud)
            if not solicitud_productos.exists():
                return Response({'error': 'No se puede crear un pedido sin productos.'}, status=status.HTTP_400_BAD_REQUEST)
            # Obtener el personal de entrega
            try:
                personal_entrega = PersonalEntrega.objects.get(id_psn=personal_entrega_id)
            except PersonalEntrega.DoesNotExist:
                return Response({'error': 'Personal de entrega no encontrado'}, status=status.HTTP_404_NOT_FOUND)
            # Obtener el estado "En camino" o crear uno por defecto
            estado_pedido, created = EstadoPedido.objects.get_or_create(
                nombre='En camino',
                defaults={'descripcion': 'Pedido en tránsito'}
            )
            # Crear el pedido
            pedido_data = {
                'descripcion': descripcion,
                'estado_pedido_fk': estado_pedido.id_estped,
                'sucursal_fk': solicitud.fk_sucursal.id,
                'personal_entrega_fk': personal_entrega.id_psn,
                'usuario_fk': request.user.id_us if hasattr(request, 'user') else solicitud.usuarios_fk.id_us,
                'solicitud_fk': solicitud.id_solc,
                'bodega_fk': solicitud.fk_bodega.id_bdg,
                'proveedor_fk': None  # Los pedidos de solicitudes no tienen proveedor
            }
            serializer = PedidosCreateSerializer(data=pedido_data)
            serializer.is_valid(raise_exception=True)
            pedido = serializer.save()
            # Crear detalles del pedido basados en los productos de la solicitud
            for sp in solicitud_productos:
                DetallePedido.objects.create(
                    cantidad=sp.cantidad,
                    descripcion=f"Producto de solicitud {solicitud.id_solc}",
                    productos_pedido_fk=sp.producto_fk,
                    pedidos_fk=pedido
                )
            logger.info(f"Pedido {pedido.id_p} creado exitosamente desde solicitud {solicitud_id}")
            return Response({
                'mensaje': 'Pedido creado exitosamente',
                'pedido': PedidosSerializer(pedido).data
            }, status=status.HTTP_201_CREATED)
        except Solicitudes.DoesNotExist:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al crear pedido desde solicitud: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='confirmar-recepcion')
    def confirmar_recepcion(self, request, id_p=None):
        """
        Confirma la recepción de un pedido y agrega los productos al inventario de la sucursal
        """
        try:
            # Obtener el pedido
            pedido = self.get_object()
            
            # Verificar que el pedido no esté ya completado
            if pedido.estado_pedido_fk.nombre == 'Completado':
                return Response({
                    'error': 'Este pedido ya ha sido confirmado anteriormente'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que el pedido esté en estado "En camino"
            if pedido.estado_pedido_fk.nombre != 'En camino':
                return Response({
                    'error': 'Solo se puede confirmar la recepción de pedidos en estado "En camino"'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener el estado "Completado"
            try:
                estado_completado = EstadoPedido.objects.get(nombre='Completado')
            except EstadoPedido.DoesNotExist:
                # Crear el estado si no existe
                estado_completado = EstadoPedido.objects.create(
                    nombre='Completado',
                    descripcion='Pedido recibido y completado'
                )
            
            # Actualizar el estado del pedido a "Completado"
            pedido.estado_pedido_fk = estado_completado
            pedido.save()
            
            # Obtener los detalles del pedido
            detalles_pedido = DetallePedido.objects.filter(pedidos_fk=pedido)
            
            # Agregar productos al inventario de la sucursal
            productos_agregados = []
            for detalle in detalles_pedido:
                # Buscar o crear el stock para este producto en la sucursal
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=detalle.productos_pedido_fk,
                    sucursal_fk=pedido.sucursal_fk.id,
                    defaults={
                        'stock': 0,
                        'stock_minimo': 0,
                        'bodega_fk': None,
                        'proveedor_fk': None
                    }
                )
                # Agregar la cantidad del pedido al stock existente
                stock_obj.stock += detalle.cantidad
                stock_obj.save()

                # Registrar movimiento de inventario
                MovInventario.objects.create(
                    cantidad=detalle.cantidad,
                    fecha=timezone.now(),
                    productos_fk=detalle.productos_pedido_fk,
                    usuario_fk=request.user
                )
                
                productos_agregados.append({
                    'producto': detalle.productos_pedido_fk.nombre_prodc,
                    'cantidad': float(detalle.cantidad),
                    'stock_actual': float(stock_obj.stock)
                })
            
            logger.info(f"Recepción confirmada para pedido {pedido.id_p}. Productos agregados al inventario: {productos_agregados}")
            
            return Response({
                'mensaje': 'Recepción confirmada exitosamente',
                'pedido_id': pedido.id_p,
                'estado_nuevo': 'Completado',
                'productos_agregados': productos_agregados,
                'sucursal': pedido.sucursal_fk.nombre_sucursal if pedido.sucursal_fk else 'N/A'
            }, status=status.HTTP_200_OK)
            
        except Pedidos.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al confirmar recepción del pedido {id_p}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='crear-ingreso-bodega')
    def crear_ingreso_bodega(self, request):
        """
        Crea un pedido de ingreso para la bodega y agrega los productos al inventario
        """
        try:
            # Debug: log de datos recibidos
            logger.info(f"DEBUG - Datos recibidos en crear_ingreso_bodega: {request.data}")
            
            # Obtener datos del request
            fecha = request.data.get('fecha')
            num_rem = request.data.get('num_rem', '')
            num_guia_despacho = request.data.get('num_guia_despacho', '')
            observaciones = request.data.get('observaciones', '')
            productos_data = request.data.get('productos', [])
            proveedor_data = request.data.get('proveedor', {})
            bodega_id = request.data.get('bodega_id')
            
            logger.info(f"DEBUG - Fecha: {fecha}")
            logger.info(f"DEBUG - Bodega ID: {bodega_id}")
            logger.info(f"DEBUG - Productos: {productos_data}")
            logger.info(f"DEBUG - Proveedor: {proveedor_data}")
            
            if not fecha:
                return Response({'error': 'Fecha es requerida'}, status=status.HTTP_400_BAD_REQUEST)
            if not productos_data:
                return Response({'error': 'Debe incluir al menos un producto'}, status=status.HTTP_400_BAD_REQUEST)
            if not bodega_id:
                return Response({'error': 'ID de bodega es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener o crear el estado "Pendiente"
            try:
                estado_pendiente = EstadoPedido.objects.get(nombre='Pendiente')
            except EstadoPedido.DoesNotExist:
                estado_pendiente = EstadoPedido.objects.create(
                    nombre='Pendiente',
                    descripcion='Pedido pendiente de procesamiento'
                )
            
            # Obtener la bodega
            try:
                bodega = BodegaCentral.objects.get(id_bdg=bodega_id)
            except BodegaCentral.DoesNotExist:
                return Response({'error': 'Bodega no encontrada'}, status=status.HTTP_404_NOT_FOUND)
            
            # Crear o actualizar el proveedor si se proporciona información
            proveedor_obj = None
            if proveedor_data and proveedor_data.get('nombre'):
                try:
                    # Buscar proveedor por RUT
                    rut_empresa = proveedor_data.get('rut', '').replace('.', '').replace('-', '').replace(' ', '')
                    
                    # Remover el dígito verificador si es una letra
                    if rut_empresa and rut_empresa[-1].isalpha():
                        rut_empresa = rut_empresa[:-1]
                    
                    # Convertir a número
                    if rut_empresa:
                        rut_numero = int(rut_empresa)
                        proveedor_obj, created = Proveedor.objects.get_or_create(
                            rut_empresa=rut_numero,
                            defaults={
                                'nombres_provd': proveedor_data.get('nombre', ''),
                                'direccion_provd': proveedor_data.get('contacto', 'Sin dirección'),
                                'correo': proveedor_data.get('email', 'sin@email.com'),
                                'razon_social': proveedor_data.get('nombre', '')
                            }
                        )
                        if not created:
                            # Actualizar información del proveedor existente
                            proveedor_obj.nombres_provd = proveedor_data.get('nombre', proveedor_obj.nombres_provd)
                            proveedor_obj.direccion_provd = proveedor_data.get('contacto', proveedor_obj.direccion_provd)
                            proveedor_obj.correo = proveedor_data.get('email', proveedor_obj.correo)
                            proveedor_obj.save()
                except (ValueError, Exception) as e:
                    logger.warning(f"No se pudo crear/actualizar proveedor: {str(e)}")
            
            # Crear el pedido
            pedido_data = {
                'descripcion': f"Ingreso desde proveedor {proveedor_data.get('nombre', 'N/A')} - REM: {num_rem} - Guía: {num_guia_despacho}",
                'estado_pedido_fk': estado_pendiente.id_estped,
                'sucursal_fk': None,  # Los ingresos de bodega no tienen sucursal
                'personal_entrega_fk': None,  # Los ingresos no tienen personal de entrega
                'usuario_fk': request.user.id_us if hasattr(request, 'user') else None,
                'solicitud_fk': None,  # Los ingresos no vienen de solicitudes
                'bodega_fk': bodega.id_bdg,
                'proveedor_fk': proveedor_obj.id_provd if proveedor_obj else None
            }
            
            serializer = PedidosCreateSerializer(data=pedido_data)
            serializer.is_valid(raise_exception=True)
            pedido = serializer.save()
            
            # Procesar productos y agregarlos al inventario
            productos_agregados = []
            for producto_info in productos_data:
                nombre = producto_info.get('nombre', '')
                cantidad = producto_info.get('cantidad', 0)
                marca_nombre = producto_info.get('marca', '')
                categoria_nombre = producto_info.get('categoria', '')
                
                if not nombre or cantidad <= 0:
                    continue
                
                # Buscar o crear la marca
                marca, created = Marca.objects.get_or_create(
                    nombre_mprod=marca_nombre,
                    defaults={'descripcion_mprod': f'Marca {marca_nombre}'}
                )
                
                # Buscar o crear la categoría
                categoria, created = Categoria.objects.get_or_create(
                    nombre=categoria_nombre,
                    defaults={'descripcion': f'Categoría {categoria_nombre}'}
                )
                
                # Buscar o crear el producto
                producto = None
                try:
                    # Primero buscar por nombre exacto, marca y categoría
                    producto = Productos.objects.get(
                        nombre_prodc__iexact=nombre,
                        marca_fk__nombre_mprod__iexact=marca_nombre,
                        categoria_fk__nombre__iexact=categoria_nombre,
                        bodega_fk=bodega
                    )
                    logger.info(f"Producto existente encontrado: {producto.nombre_prodc}")
                except Productos.DoesNotExist:
                    # Si no existe, crear uno nuevo
                    producto = Productos.objects.create(
                        nombre_prodc=nombre,
                        marca_fk=marca,
                        categoria_fk=categoria,
                        bodega_fk=bodega,
                        descripcion_prodc=f'{nombre} - {marca_nombre} - {categoria_nombre}',
                        codigo_interno=f'{nombre}-{marca_nombre}-{categoria_nombre}'.replace(' ', '-').lower(),
                        fecha_creacion=timezone.now(),
                        sucursal_fk=None
                    )
                    logger.info(f"Nuevo producto creado: {producto.nombre_prodc}")
                
                # Crear detalle del pedido
                DetallePedido.objects.create(
                    cantidad=cantidad,
                    descripcion=f"Producto de ingreso: {nombre}",
                    productos_pedido_fk=producto,
                    pedidos_fk=pedido
                )
                
                # Buscar o crear el stock para este producto en la bodega
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=producto,
                    bodega_fk=bodega.id_bdg,
                    defaults={
                        'stock': 0,
                        'stock_minimo': 5,
                        'sucursal_fk': None,
                        'proveedor_fk': None
                    }
                )
                
                # Agregar la cantidad al stock existente
                stock_obj.stock += cantidad
                stock_obj.save()
                
                # Registrar movimiento de inventario
                MovInventario.objects.create(
                    cantidad=cantidad,
                    fecha=timezone.now(),
                    productos_fk=producto,
                    usuario_fk=request.user
                )
                
                productos_agregados.append({
                    'producto': producto.nombre_prodc,
                    'cantidad': float(cantidad),
                    'stock_actual': float(stock_obj.stock),
                    'marca': marca.nombre_mprod,
                    'categoria': categoria.nombre
                })
            
            logger.info(f"Ingreso creado para bodega {bodega.nombre_bdg}. Productos agregados: {productos_agregados}")
            
            # Guardar historial de ingreso del proveedor si existe
            if proveedor_obj:
                try:
                    # Crear un registro de historial por cada producto del ingreso
                    for producto_info in productos_data:
                        nombre = producto_info.get('nombre', '')
                        cantidad = producto_info.get('cantidad', 0)
                        
                        # Buscar el producto en la base de datos
                        try:
                            # Buscar el producto más específicamente usando marca y categoría también
                            producto_obj = Productos.objects.get(
                                nombre_prodc__iexact=nombre,
                                marca_fk__nombre_mprod__iexact=producto_info.get('marca', ''),
                                categoria_fk__nombre__iexact=producto_info.get('categoria', ''),
                                bodega_fk=bodega
                            )
                            
                            # Crear registro de historial
                            Historial.objects.create(
                                fecha=timezone.now(),
                                usuario_fk=request.user,
                                pedidos_fk=pedido,
                                producto_fk=producto_obj
                            )
                        except Productos.DoesNotExist:
                            logger.warning(f"Producto {nombre} no encontrado para historial")
                        except Productos.MultipleObjectsReturned:
                            # Si hay múltiples productos, usar el más reciente
                            producto_obj = Productos.objects.filter(
                                nombre_prodc__iexact=nombre,
                                bodega_fk=bodega
                            ).order_by('-fecha_creacion').first()
                            
                            if producto_obj:
                                Historial.objects.create(
                                    fecha=timezone.now(),
                                    usuario_fk=request.user,
                                    pedidos_fk=pedido,
                                    producto_fk=producto_obj
                                )
                            else:
                                logger.warning(f"No se pudo encontrar producto {nombre} para historial")
                    
                    logger.info(f"Historial de ingreso guardado para proveedor {proveedor_obj.nombres_provd}")
                except Exception as e:
                    logger.warning(f"No se pudo guardar historial de ingreso: {str(e)}")
            
            return Response({
                'mensaje': 'Ingreso creado exitosamente',
                'pedido_id': pedido.id_p,
                'productos_agregados': productos_agregados,
                'bodega': bodega.nombre_bdg
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error al crear ingreso de bodega: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PersonalEntregaViewSet(viewsets.ModelViewSet):
    queryset = PersonalEntrega.objects.all()
    serializer_class = PersonalEntregaSerializer
    lookup_field = 'id_psn'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = PersonalEntrega.objects.all()
        bodega_id = self.request.query_params.get('bodega_id')
        
        if bodega_id:
            queryset = queryset.filter(usuario_fk__bodeg_fk__id_bdg=bodega_id)
        
        return queryset

    @action(detail=False, methods=['post'], url_path='crear-desde-usuario')
    def crear_desde_usuario(self, request):
        """
        Crea un registro de personal de entrega a partir de un usuario transportista
        """
        try:
            usuario_id = request.data.get('usuario_id')
            patente = request.data.get('patente')
            descripcion = request.data.get('descripcion', 'Transportista')
            
            if not usuario_id:
                return Response({'error': 'usuario_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not patente:
                return Response({'error': 'patente es requerida'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que el usuario existe y es transportista
            usuario = Usuario.objects.get(id_us=usuario_id)
            if usuario.rol_fk.nombre_rol != 'transportista':
                return Response({'error': 'El usuario debe tener rol de transportista'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear el personal de entrega
            personal_entrega = PersonalEntrega.objects.create(
                usuario_fk=usuario,
                nombre_psn=usuario.nombre,
                descripcion=descripcion,
                patente=patente
            )
            
            serializer = self.get_serializer(personal_entrega)
            return Response({
                'mensaje': 'Personal de entrega creado exitosamente',
                'personal_entrega': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al crear personal de entrega: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    lookup_field = 'id_provd'
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Proveedor.objects.all()
        # Aquí podrías agregar filtros si es necesario
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creando proveedor con datos: {request.data}")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear proveedor: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error al actualizar proveedor: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(
                {'mensaje': f'Proveedor {instance.id_provd} eliminado exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error al eliminar proveedor: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='crear-o-actualizar')
    def crear_o_actualizar(self, request):
        """
        Crea un proveedor si no existe, o lo actualiza si ya existe pero no tiene pedidos
        """
        try:
            logger.info(f"🔍 DEBUG - Datos recibidos en crear_o_actualizar: {request.data}")
            rut_empresa = request.data.get('rut_empresa')
            if not rut_empresa:
                logger.error("❌ ERROR - RUT de empresa es requerido")
                return Response({'error': 'RUT de empresa es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"🔍 DEBUG - Buscando proveedor con RUT: {rut_empresa}")
            
            # Buscar si ya existe el proveedor
            try:
                proveedor = Proveedor.objects.get(rut_empresa=rut_empresa)
                logger.info(f"🔍 DEBUG - Proveedor encontrado: {proveedor.nombres_provd} (ID: {proveedor.id_provd})")
                
                # Verificar si el proveedor tiene pedidos asociados
                tiene_pedidos = Pedidos.objects.filter(proveedor_fk=proveedor).exists()
                logger.info(f"🔍 DEBUG - Proveedor tiene pedidos: {tiene_pedidos}")
                
                if tiene_pedidos:
                    # Si tiene pedidos, no permitir actualizar para preservar el historial
                    logger.info(f"🔍 DEBUG - No se puede actualizar proveedor con pedidos existentes")
                    return Response({
                        'error': 'No se puede actualizar este proveedor porque ya tiene pedidos asociados. Para cambios, cree un nuevo proveedor con un RUT diferente.',
                        'proveedor_existente': {
                            'id': proveedor.id_provd,
                            'nombre_empresa': proveedor.nombres_provd,
                            'rut_empresa': proveedor.rut_empresa,
                            'email': proveedor.correo,
                            'direccion': proveedor.direccion_provd
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Si no tiene pedidos, permitir actualizar
                    logger.info(f"🔍 DEBUG - Actualizando proveedor sin pedidos")
                    serializer = self.get_serializer(proveedor, data=request.data, partial=True)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    logger.info(f"✅ Proveedor actualizado exitosamente")
                    return Response({
                        'mensaje': 'Proveedor actualizado exitosamente',
                        'proveedor': serializer.data
                    }, status=status.HTTP_200_OK)
                    
            except Proveedor.DoesNotExist:
                # Crear nuevo proveedor
                logger.info(f"🔍 DEBUG - Creando nuevo proveedor")
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                logger.info(f"✅ Nuevo proveedor creado exitosamente")
                return Response({
                    'mensaje': 'Proveedor creado exitosamente',
                    'proveedor': serializer.data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"❌ Error al crear o actualizar proveedor: {str(e)}")
            logger.error(f"❌ Tipo de error: {type(e).__name__}")
            import traceback
            logger.error(f"❌ Traceback completo: {traceback.format_exc()}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='historial-ingresos')
    def historial_ingresos(self, request, id_provd=None):
        """
        Obtiene el historial de ingresos de un proveedor específico
        """
        try:
            # Buscar el proveedor
            proveedor = Proveedor.objects.get(id_provd=id_provd)
            
            # Buscar pedidos asociados a este proveedor
            pedidos = Pedidos.objects.filter(proveedor_fk=proveedor).order_by('-fecha_entrega')
            
            historiales_data = []
            for pedido in pedidos:
                # Obtener detalles del pedido
                detalles = DetallePedido.objects.filter(pedidos_fk=pedido)
                
                # Agrupar productos por pedido
                productos_pedido = []
                for detalle in detalles:
                    productos_pedido.append({
                        'nombre': detalle.productos_pedido_fk.nombre_prodc,
                        'cantidad': float(detalle.cantidad),
                        'marca': detalle.productos_pedido_fk.marca_fk.nombre_mprod if detalle.productos_pedido_fk.marca_fk else '',
                        'categoria': detalle.productos_pedido_fk.categoria_fk.nombre if detalle.productos_pedido_fk.categoria_fk else ''
                    })
                
                # Extraer información del pedido (REM, guía, etc. desde la descripción)
                descripcion = pedido.descripcion
                num_rem = ''
                num_guia_despacho = ''
                
                # Intentar extraer REM y guía de la descripción usando regex más robusto
                # Buscar patrones como "REM: REM-202506-0001" o "REM: 12345"
                rem_match = re.search(r'REM:\s*([A-Za-z0-9\-]+)', descripcion, re.IGNORECASE)
                if rem_match:
                    num_rem = rem_match.group(1).strip()
                
                # Buscar patrones como "Guía: GD-2025-0087" o "Guía: 12345"
                guia_match = re.search(r'Guía:\s*([A-Za-z0-9\-]+)', descripcion, re.IGNORECASE)
                if guia_match:
                    num_guia_despacho = guia_match.group(1).strip()
                
                historiales_data.append({
                    'id': pedido.id_p,
                    'fecha': pedido.fecha_entrega.strftime('%Y-%m-%d'),
                    'num_rem': num_rem,
                    'num_guia_despacho': num_guia_despacho,
                    'archivo_guia': f'ActaRecepcion_{pedido.id_p}.pdf',
                    'observaciones': descripcion,
                    'productos': productos_pedido,
                    'pedido_id': pedido.id_p
                })
            
            return Response({
                'proveedor_id': id_provd,
                'historiales': historiales_data
            }, status=status.HTTP_200_OK)
            
        except Proveedor.DoesNotExist:
            return Response({'error': 'Proveedor no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al obtener historial de ingresos: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

MARCAS = [
    'Stanley', 'Bosch', 'Makita', 'Dewalt', 'Black+Decker', 'Einhell', 'Truper', 'Irwin', 'Hilti', '3M'
]

CATEGORIAS = {
    'Herramientas manuales': ['martillo', 'destornillador', 'llave inglesa', 'alicate'],
    'Herramientas eléctricas': ['taladro', 'atornillador', 'amoladora', 'sierracircular'],
    'Materiales de fijación': ['clavo', 'tornillo', 'perno', 'tarugo'],
    'Medición y nivelación': ['cinta métrica', 'nivel', 'escuadra'],
    'Seguridad industrial': ['guantes', 'gafas', 'casco', 'mascarilla'],
    'Accesorios': ['broca', 'disco de corte', 'hoja de sierra']
}

def buscar_patron(patron, texto):
    match = re.search(patron, texto, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else ''

class ExtraerProductosPDF(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'No se envió archivo'}, status=400)
        
        productos = []
        datos = {
            'proveedor': '',
            'rut': '',
            'direccion': '',
            'fecha': '',
            'num_guia': '',
            'num_rem': '',
            'observaciones': '',
            'contacto': '',
            'email': '',
            'telefono': ''
        }
        
        try:
            with pdfplumber.open(archivo) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ''
                    print('TEXTO EXTRAÍDO:', repr(text))  # Debug
                    
                    # Procesar línea por línea para extraer datos
                    for i, line in enumerate(text.split('\n')):
                        line = line.strip()
                        print(f"Línea {i}: {repr(line)}")
                        
                        # Patrones más flexibles para extraer información
                        if any(keyword in line.lower() for keyword in ['proveedor:', 'empresa:', 'razón social:', 'nombre:']):
                            if ':' in line:
                                datos['proveedor'] = line.split(':', 1)[1].strip()
                        
                        if any(keyword in line.lower() for keyword in ['rut:', 'r.u.t:', 'identificación:', 'cédula:']):
                            if ':' in line:
                                rut = line.split(':', 1)[1].strip()
                                # Limpiar formato del RUT
                                rut = re.sub(r'[^\d\-kK]', '', rut)
                                datos['rut'] = rut
                        
                        if any(keyword in line.lower() for keyword in ['dirección:', 'direccion:', 'domicilio:', 'address:']):
                            if ':' in line:
                                datos['direccion'] = line.split(':', 1)[1].strip()
                        
                        if any(keyword in line.lower() for keyword in ['fecha:', 'fecha de emisión:', 'fecha emisión:', 'date:']):
                            if ':' in line:
                                fecha = line.split(':', 1)[1].strip()
                                # Limpiar y normalizar fecha
                                fecha = re.sub(r'[^\d\/\-]', '', fecha)
                                datos['fecha'] = fecha
                        
                        if any(keyword in line.lower() for keyword in ['guía:', 'guia:', 'número de guía:', 'numero de guia:', 'guía nº:', 'guia nº:']):
                            if ':' in line:
                                guia = line.split(':', 1)[1].strip()
                                datos['num_guia'] = guia
                        
                        if any(keyword in line.lower() for keyword in ['rem:', 'número rem:', 'numero rem:', 'rem nº:', 'rem n°:']):
                            if ':' in line:
                                rem = line.split(':', 1)[1].strip()
                                datos['num_rem'] = rem
                        
                        if any(keyword in line.lower() for keyword in ['teléfono:', 'telefono:', 'fono:', 'phone:']):
                            if ':' in line:
                                datos['telefono'] = line.split(':', 1)[1].strip()
                        
                        if any(keyword in line.lower() for keyword in ['email:', 'correo:', 'e-mail:']):
                            if ':' in line:
                                datos['email'] = line.split(':', 1)[1].strip()
                        
                        if any(keyword in line.lower() for keyword in ['contacto:', 'representante:', 'atencion:']):
                            if ':' in line:
                                datos['contacto'] = line.split(':', 1)[1].strip()
                        
                        if any(keyword in line.lower() for keyword in ['observaciones:', 'observación:', 'notas:', 'comentarios:']):
                            if ':' in line:
                                datos['observaciones'] = line.split(':', 1)[1].strip()
                    
                    # Procesar tablas para productos
                    tables = page.extract_tables()
                    for table in tables:
                        for i, row in enumerate(table):
                            if i == 0:
                                continue  # Saltar encabezado
                            if not row or all(cell is None or cell.strip() == '' for cell in row):
                                continue
                            
                            nombre = row[0] or ''
                            codigo = row[1] or ''
                            try:
                                cantidad = int(row[2]) if row[2] and str(row[2]).replace('.', '').isdigit() else 1
                            except Exception:
                                cantidad = 1
                            
                            # Inferir marca y categoría
                            marca = ''
                            for m in MARCAS:
                                if m.lower() in nombre.lower():
                                    marca = m
                                    break
                            
                            categoria = 'General'
                            for cat, palabras in CATEGORIAS.items():
                                if any(palabra in nombre.lower() for palabra in palabras):
                                    categoria = cat
                                    break
                            
                            if nombre and cantidad > 0:
                                productos.append({
                                    'nombre': nombre,
                                    'codigo': codigo,
                                    'cantidad': cantidad,
                                    'marca': marca,
                                    'categoria': categoria
                                })
            
            print('DATOS EXTRAÍDOS:', datos)
            print('PRODUCTOS EXTRAÍDOS:', len(productos))
            
            return Response({
                'productos': productos, 
                'datos': datos,
                'resumen': {
                    'total_productos': len(productos),
                    'campos_extraidos': {k: v for k, v in datos.items() if v},
                    'campos_vacios': {k: v for k, v in datos.items() if not v}
                }
            })
            
        except Exception as e:
            logger.error(f"Error al procesar PDF: {str(e)}")
            return Response({
                'error': f'Error al procesar el PDF: {str(e)}',
                'productos': [],
                'datos': datos
            }, status=500)