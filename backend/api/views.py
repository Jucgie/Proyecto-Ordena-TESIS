from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from .models import Usuario, Rol, BodegaCentral, Sucursal, Productos, Marca, Categoria, Solicitudes,Pedidos,PersonalEntrega,DetallePedido,EstadoPedido, Informe, SolicitudProductos, Pedidos, DetallePedido, Notificacion, Historial, Stock, EstadoPedido, PersonalEntrega, MovInventario, Proveedor, UsuarioNotificacion, HistorialEstadoPedido
from .serializers import LoginSerializer, RegisterSerializer, ProductoSerializer, HistorialPedidosDetalladoSerializer,MarcaSerializer, CategoriaSerializer, SolicitudesSerializer, SolicitudesCreateSerializer, PedidosSerializer,PersonalEntregaSerializer,DetallePedidoSerializer,EstadoPedidoSerializer, UsuarioSerializer, InformeSerializer, InformeCreateSerializer, PedidosSerializer, PedidosCreateSerializer, PersonalEntregaSerializer, ProveedorSerializer, MovInventarioSerializer, NotificacionSerializer, UsuarioNotificacionSerializer, BodegaCentralSerializer, ProductoSucursalSerializer, ProductoBodegaSerializer, HistorialEstadoPedidoSerializer, HistorialSerializer
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import viewsets
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timezone as datetime_timezone
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework import serializers
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
import json
import pdfplumber
import re
import qrcode
import base64
from io import BytesIO
from django.http import HttpResponse
from django.conf import settings
from django.db import models
from api.utils.notificaciones import crear_notificacion
from django.db.models import Min
from django.db import IntegrityError

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
    pagination_class = None
    

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Productos.objects.filter(activo=True)
        bodega_id = self.request.query_params.get('bodega_id')
        sucursal_id = self.request.query_params.get('sucursal_id')
        
        
        
        if bodega_id:
            # Filtrar productos que tienen stock en la bodega
            productos_con_stock = Stock.objects.filter(
                bodega_fk=bodega_id,
                stock__gt=0
            ).values_list('productos_fk', flat=True)
            queryset = queryset.filter(id_prodc__in=productos_con_stock)
            
        elif sucursal_id:
            # Filtrar productos que tienen stock en la sucursal
            productos_con_stock = Stock.objects.filter(
                sucursal_fk=sucursal_id,
                stock__gt=0
            ).values_list('productos_fk', flat=True)
            queryset = queryset.filter(id_prodc__in=productos_con_stock)
        return queryset

    def perform_create(self, serializer):
        if not (self.request.data.get('bodega_fk') or self.request.data.get('sucursal_fk')):
            raise serializers.ValidationError(
                "Se requiere especificar bodega_fk o sucursal_fk"
            )
        serializer.save()

    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        try:
            logger.info(f"[CREAR PRODUCTO] Datos recibidos: {request.data}")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            logger.info(f"[CREAR PRODUCTO] Datos validados: {serializer.validated_data}")
            self.perform_create(serializer)
            producto = serializer.instance

            # --- LOG: Usuario autenticado ---
            logger.info(f"[CREAR PRODUCTO] Usuario autenticado: {request.user} (ID: {getattr(request.user, 'id_us', None)})")

            # --- NUEVO: Crear stock si no existe y movimiento inicial ---
            stock_inicial = serializer.validated_data.get('stock')
            motivo = request.data.get('motivo') or 'Creación de producto'
            usuario = request.user
            bodega_id = request.data.get('bodega_fk')
            sucursal_id = request.data.get('sucursal_fk')
            from api.models import Stock, MovInventario
            stock_obj = None
            logger.info(f"[CREAR PRODUCTO] bodega_id={bodega_id}, sucursal_id={sucursal_id}, stock_inicial={stock_inicial}, motivo={motivo}")
            if bodega_id:
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=producto,
                    bodega_fk=bodega_id,
                    defaults={'stock': stock_inicial or 0, 'stock_minimo': 0, 'stock_maximo': 0}
                )
                logger.info(f"[CREAR PRODUCTO] Stock bodega creado={created}, id={stock_obj.id_stock}, stock={stock_obj.stock}")
            elif sucursal_id:
                stock_obj, created = Stock.objects.get_or_create(
                    productos_fk=producto,
                    sucursal_fk=sucursal_id,
                    defaults={'stock': stock_inicial or 0, 'stock_minimo': 0, 'stock_maximo': 0}
                )
                logger.info(f"[CREAR PRODUCTO] Stock sucursal creado={created}, id={stock_obj.id_stock}, stock={stock_obj.stock}")
            else:
                logger.warning(f"[CREAR PRODUCTO] No se especificó bodega ni sucursal para el stock inicial")
            # Si el stock ya existía, actualiza el valor si corresponde
            if stock_obj and stock_inicial is not None:
                try:
                    stock_inicial = float(stock_inicial)
                    if stock_obj.stock != stock_inicial:
                        stock_obj.stock = stock_inicial
                        stock_obj.save()
                        logger.info(f"[CREAR PRODUCTO] Stock actualizado a {stock_inicial}")
                    # Solo crear movimiento si el stock inicial es mayor a 0 y no existe ya un movimiento para este producto
                    existe_mov = MovInventario.objects.filter(productos_fk=producto).exists()
                    logger.info(f"[CREAR PRODUCTO] ¿Ya existe movimiento para este producto? {existe_mov}")
                    if stock_inicial > 0 and not existe_mov:
                        mov = MovInventario.objects.create(
                            cantidad=stock_inicial,
                            fecha=producto.fecha_creacion,
                            productos_fk=producto,
                            usuario_fk=usuario,
                            motivo=motivo
                        )
                        logger.info(f"[CREAR PRODUCTO] ✅ Movimiento inicial creado: id={mov.id_mvin}, cantidad={stock_inicial}, motivo='{motivo}', usuario={usuario}")
                except Exception as e:
                    logger.error(f"[CREAR PRODUCTO] Error creando movimiento inicial: {str(e)}")
            else:
                logger.warning(f"[CREAR PRODUCTO] No se creó movimiento inicial: stock_obj={stock_obj}, stock_inicial={stock_inicial}")
            # --- FIN NUEVO ---

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            logger.error(f"[CREAR PRODUCTO] Error de validación: {str(e)}")
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"[CREAR PRODUCTO] Error general: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            logger.info(f"Actualizando producto {kwargs.get('id_prodc')} con datos: {request.data}")
            logger.info(f"🔍 DEBUG - request.data completo: {request.data}")
            logger.info(f"🔍 DEBUG - request.data.keys(): {list(request.data.keys())}")
            logger.info(f"🔍 DEBUG - motivo en request.data: {request.data.get('motivo', 'NO ENCONTRADO')}")
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # --- CORRECCIÓN: Obtener el stock anterior desde la tabla Stock ---
            bodega_id = request.data.get('bodega_fk') or (instance.bodega_fk.id_bdg if instance.bodega_fk else None)
            sucursal_id = request.data.get('sucursal_fk') or (instance.sucursal_fk.id if instance.sucursal_fk else None)
            
            if bodega_id:
                stock_obj = Stock.objects.filter(productos_fk=instance, bodega_fk=bodega_id).first()
            elif sucursal_id:
                stock_obj = Stock.objects.filter(productos_fk=instance, sucursal_fk=sucursal_id).first()
            else:
                stock_obj = None
                
            stock_anterior = float(stock_obj.stock) if stock_obj else 0
            # ---------------------------------------------------------------
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            logger.info(f"🔍 DEBUG - motivo en serializer.context: {serializer.context.get('motivo', 'NO ENCONTRADO')}")
            self.perform_update(serializer)
            
            # --- MEJORADO: Guardar en historial SIEMPRE que cambie el stock ---
            stock_nuevo = request.data.get('stock_write')
            # Obtener el motivo del contexto del serializer
            # Solo actualizar el stock sin crear movimientos automáticamente
            # Los movimientos se crearán solo cuando se use específicamente la función de actualizar stock
            if stock_nuevo is not None:
                stock_nuevo = float(stock_nuevo)
                if stock_nuevo != stock_anterior:
                    # Actualizar el stock en la tabla Stock
                    if stock_obj:
                        stock_obj.stock = stock_nuevo
                        stock_obj.save()
                    
                    logger.info(f"✅ Stock actualizado: {stock_anterior}→{stock_nuevo} (sin movimiento automático)")
                else:
                    logger.info(f"ℹ️ No se actualizó stock: no cambió ({stock_anterior})")
            else:
                logger.warning(f"⚠️ No se recibió stock_write en la actualización")
            
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
            instance.activo = False
            instance.save()
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
        limit = int(self.request.query_params.get('limit', 20))
        offset = int(self.request.query_params.get('offset', 0))
        if bodega_id:
            queryset = queryset.filter(fk_bodega=bodega_id)
        if sucursal_id:
            queryset = queryset.filter(fk_sucursal=sucursal_id)
        queryset = queryset.order_by('-fecha_creacion')
        if hasattr(self, 'action') and self.action == 'list':
            return queryset[offset:offset+limit]
        return queryset

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
            estado_anterior = getattr(instance, 'estado', None)
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
            if not serializer.is_valid():
                return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            self.perform_update(serializer)
            estado_nuevo = serializer.validated_data.get('estado', None)
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
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except serializers.ValidationError as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
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
    pagination_class = None

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
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')

        if bodega_id:
            queryset = queryset.filter(bodega_fk=bodega_id)
        if sucursal_id:
            queryset = queryset.filter(sucursal_fk=sucursal_id)
        if estado:
            queryset = queryset.filter(estado_pedido_fk__nombre=estado)
        if fecha_inicio:
            queryset = queryset.filter(fecha_entrega__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_entrega__lte=fecha_fin)
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
            # Notificación automática al usuario solicitante
            pedido_id = serializer.data.get('id_p')
            if pedido_id:
                try:
                    pedido = Pedidos.objects.get(id_p=pedido_id)
                    # --- REGISTRO DE HISTORIAL DE ESTADO INICIAL ---
                    if pedido.estado_pedido_fk:
                        from .models import HistorialEstadoPedido
                        HistorialEstadoPedido.objects.create(
                            pedido_fk=pedido,
                            estado_anterior=None,
                            estado_nuevo=pedido.estado_pedido_fk,
                            usuario_fk=request.user,
                            comentario="Pedido creado"
                        )
                    # --- FIN REGISTRO HISTORIAL ---
                    if pedido.usuario_fk:
                        crear_notificacion(
                            usuario=pedido.usuario_fk,
                            nombre=f"Pedido #{pedido.id_p} creado",
                            descripcion=f"Tu pedido #{pedido.id_p} ha sido registrado exitosamente.",
                            tipo="info",
                            pedido=pedido
                        )
                except Exception as e:
                    logger.error(f"Error creando notificación de pedido creado: {str(e)}")
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
            if estado_nuevo and hasattr(estado_nuevo, 'nombre'):
                # --- REGISTRO DE HISTORIAL SOLO SI CAMBIA EL ESTADO ---
                if estado_anterior != estado_nuevo.nombre:
                    from .models import HistorialEstadoPedido
                    HistorialEstadoPedido.objects.create(
                        pedido_fk=instance,
                        estado_anterior=instance.estado_pedido_fk,
                        estado_nuevo=estado_nuevo,
                        usuario_fk=request.user,
                        comentario="Cambio de estado"
                    )
                # --- FIN REGISTRO HISTORIAL ---
                if estado_nuevo.nombre == 'En camino' and estado_anterior != 'En camino':
                    # Notificar a la sucursal que el pedido fue despachado
                    if instance.sucursal_fk and hasattr(instance.sucursal_fk, 'usuarios_fk'):
                        crear_notificacion(
                            usuario=instance.sucursal_fk.usuarios_fk,
                            nombre=f"Pedido #{instance.id_p} despachado",
                            descripcion=f"Tu pedido #{instance.id_p} ha sido despachado y está en camino.",
                            tipo="success",
                            pedido=instance
                        )
                if estado_nuevo.nombre == 'Completado' and estado_anterior != 'Completado':
                    # Notificar a la sucursal que el pedido fue recibido
                    if instance.sucursal_fk and hasattr(instance.sucursal_fk, 'usuarios_fk'):
                        crear_notificacion(
                            usuario=instance.sucursal_fk.usuarios_fk,
                            nombre=f"Pedido #{instance.id_p} recibido",
                            descripcion=f"Tu pedido #{instance.id_p} ha sido recibido y completado.",
                            tipo="success",
                            pedido=instance
                        )
                if estado_nuevo.nombre == 'Rechazado' and estado_anterior != 'Rechazado':
                    # Notificar al usuario solicitante que el pedido fue rechazado
                    if instance.usuario_fk:
                        crear_notificacion(
                            usuario=instance.usuario_fk,
                            nombre=f"Pedido #{instance.id_p} rechazado",
                            descripcion=f"Tu pedido #{instance.id_p} ha sido rechazado.",
                            tipo="error",
                            pedido=instance
                        )
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
            # Obtener el estado "Pendiente" o crear uno por defecto
            estado_pendiente, _ = EstadoPedido.objects.get_or_create(
                nombre='Pendiente',
                defaults={'descripcion': 'Pedido pendiente'}
            )
            # Crear el pedido en estado Pendiente
            pedido_data = {
                'descripcion': descripcion,
                'estado_pedido_fk': estado_pendiente.id_estped,
                'sucursal_fk': solicitud.fk_sucursal.id,
                'personal_entrega_fk': personal_entrega.id_psn,
                'usuario_fk': request.user.id_us if hasattr(request, 'user') else solicitud.usuarios_fk.id_us,
                'solicitud_fk': solicitud.id_solc,
                'bodega_fk': solicitud.fk_bodega.id_bdg,
                'proveedor_fk': None
            }
            serializer = PedidosCreateSerializer(data=pedido_data)
            serializer.is_valid(raise_exception=True)
            pedido = serializer.save()
            # Registrar historial: Pendiente
            from .models import HistorialEstadoPedido
            HistorialEstadoPedido.objects.create(
                pedido_fk=pedido,
                estado_anterior=None,
                estado_nuevo=estado_pendiente,
                usuario_fk=request.user,
                comentario='Registro automático: Pedido creado (Pendiente)'
            )
            # Crear detalles del pedido basados en los productos de la solicitud
            for sp in solicitud_productos:
                DetallePedido.objects.create(
                    cantidad=sp.cantidad,
                    descripcion=f"Producto de solicitud {solicitud.id_solc}",
                    productos_pedido_fk=sp.producto_fk,
                    pedidos_fk=pedido
                )
                try:
                    stock_obj, _ = Stock.objects.get_or_create(
                        productos_fk=sp.producto_fk,
                        bodega_fk=solicitud.fk_bodega.id_bdg,
                        defaults={'stock': 0, 'stock_minimo': 0, 'stock_maximo': 0, 'sucursal_fk': None, 'proveedor_fk': None}
                    )
                    MovInventario.objects.create(
                        cantidad=-abs(sp.cantidad),
                        fecha=timezone.now(),
                        productos_fk=sp.producto_fk,
                        usuario_fk=request.user,
                        motivo='Salida por pedido a sucursal'
                    )
                except Exception as e:
                    logger.error(f"Error registrando salida de inventario para producto {sp.producto_fk}: {str(e)}")
            # Obtener el estado "En camino"
            estado_en_camino, _ = EstadoPedido.objects.get_or_create(
                nombre='En camino',
                defaults={'descripcion': 'Pedido en tránsito'}
            )
            # Actualizar el pedido a estado En camino
            pedido.estado_pedido_fk = estado_en_camino
            pedido.save()
            # Registrar historial: En camino
            HistorialEstadoPedido.objects.create(
                pedido_fk=pedido,
                estado_anterior=estado_pendiente,
                estado_nuevo=estado_en_camino,
                usuario_fk=request.user,
                comentario='Registro automático: Pedido despachado (En camino)'
            )
            logger.info(f"Pedido {pedido.id_p} creado exitosamente desde solicitud {solicitud_id} (Pendiente → En camino)")
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
            
            # --- REGISTRO DE HISTORIAL DE ESTADO ---
            from .models import HistorialEstadoPedido
            estado_anterior = pedido.estado_pedido_fk
            HistorialEstadoPedido.objects.create(
                pedido_fk=pedido,
                estado_anterior=estado_anterior,
                estado_nuevo=estado_completado,
                usuario_fk=request.user,
                comentario="Recepción confirmada"
            )
            # --- FIN REGISTRO HISTORIAL ---
            
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
                    usuario_fk=request.user,
                    motivo='Ingreso por pedido'
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
    @transaction.atomic  # <--- ATOMICIDAD AGREGADA
    def crear_ingreso_bodega(self, request):
        """
        Crea un pedido de ingreso para la bodega y agrega los productos al inventario
        """
        logger.info("[crear_ingreso_bodega] INICIO del proceso de ingreso de bodega")
        try:
            # Obtener datos del request
            fecha = request.data.get('fecha')
            num_rem = request.data.get('num_rem', '')
            num_guia_despacho = request.data.get('num_guia_despacho', '')
            observaciones = request.data.get('observaciones', '')
            productos_data = request.data.get('productos', [])
            proveedor_data = request.data.get('proveedor', {})
            bodega_id = request.data.get('bodega_id')
            logger.info(f"[crear_ingreso_bodega] Datos recibidos: fecha={fecha}, bodega_id={bodega_id}, num_rem={num_rem}, num_guia_despacho={num_guia_despacho}, observaciones={observaciones}")
            logger.info(f"[crear_ingreso_bodega] Productos recibidos: {productos_data}")
            logger.info(f"[crear_ingreso_bodega] Proveedor recibido: {proveedor_data}")
            
            if not fecha:
                return Response({'error': 'Fecha es requerida'}, status=status.HTTP_400_BAD_REQUEST)
            if not productos_data:
                return Response({'error': 'Debe incluir al menos un producto'}, status=status.HTTP_400_BAD_REQUEST)
            if not bodega_id:
                return Response({'error': 'ID de bodega es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            # --- VALIDACIÓN DE DUPLICADOS POR GUÍA DE DESPACHO Y BODEGA ---
            # Log de todas las guías existentes para esa bodega
            guias_existentes = list(Pedidos.objects.filter(bodega_fk=bodega_id).values_list('num_guia_despacho', flat=True))
            logger.info(f"[crear_ingreso_bodega] Guías existentes en bodega {bodega_id}: {guias_existentes}")
            logger.info(f"[crear_ingreso_bodega] Guía recibida: '{num_guia_despacho}'")
            if num_guia_despacho and bodega_id:
                guia_normalizada = num_guia_despacho.strip().upper()
                guias_existentes_normalizadas = [ (g.strip().upper() if g else '') for g in guias_existentes ]
                logger.info(f"[crear_ingreso_bodega] Guías normalizadas en bodega {bodega_id}: {guias_existentes_normalizadas}")
                logger.info(f"[crear_ingreso_bodega] Guía recibida normalizada: '{guia_normalizada}'")
                if guia_normalizada in guias_existentes_normalizadas:
                    return Response({'error': 'Ya existe un ingreso con la misma guía de despacho en esta bodega.'}, status=status.HTTP_400_BAD_REQUEST)
            # ... existing code ...
            
            # Obtener o crear el estado "Completado" (no Pendiente)
            try:
                estado_completado = EstadoPedido.objects.get(nombre='Completado')
            except EstadoPedido.DoesNotExist:
                estado_completado = EstadoPedido.objects.create(
                    nombre='Completado',
                    descripcion='Pedido recibido y completado'
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
                    rut_empresa = proveedor_data.get('rut', '').replace('.', '').replace('-', '').replace(' ', '')
                    if rut_empresa and rut_empresa[-1].isalpha():
                        rut_empresa = rut_empresa[:-1]
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
                            proveedor_obj.nombres_provd = proveedor_data.get('nombre', proveedor_obj.nombres_provd)
                            proveedor_obj.direccion_provd = proveedor_data.get('contacto', proveedor_obj.direccion_provd)
                            proveedor_obj.correo = proveedor_data.get('email', proveedor_obj.correo)
                            proveedor_obj.save()
                except (ValueError, Exception) as e:
                    logger.warning(f"No se pudo crear/actualizar proveedor: {str(e)}")
            
            # Crear el pedido
            descripcion_parts = [f"Ingreso desde proveedor {proveedor_data.get('nombre', 'N/A')}"]
            if num_guia_despacho and num_guia_despacho.strip():
                descripcion_parts.append(f"Guía: {num_guia_despacho}")
            descripcion = " - ".join(descripcion_parts)
            pedido_data = {
                'descripcion': descripcion,
                'estado_pedido_fk': estado_completado.id_estped,  # <-- SIEMPRE COMPLETADO
                'sucursal_fk': None,
                'personal_entrega_fk': None,
                'usuario_fk': request.user.id_us if hasattr(request, 'user') else None,
                'solicitud_fk': None,
                'bodega_fk': bodega.id_bdg,
                'proveedor_fk': proveedor_obj.id_provd if proveedor_obj else None,
                'num_guia_despacho': num_guia_despacho
            }
            
            serializer = PedidosCreateSerializer(data=pedido_data)
            serializer.is_valid(raise_exception=True)
            try:
                pedido = serializer.save()
            except IntegrityError as e:
                if 'idx_pedidos_guia_bodega' in str(e) or 'unique constraint' in str(e).lower():
                    return Response({'error': 'Ya existe un ingreso con este número de guía de despacho en esta bodega.'}, status=status.HTTP_400_BAD_REQUEST)
                raise
            
            try:
                historial = HistorialEstadoPedido.objects.create(
                    pedido_fk=pedido,
                    estado_anterior=None,
                    estado_nuevo=estado_completado,
                    usuario_fk=request.user,
                    fecha=timezone.now(),  # Usar fecha actual para evitar problemas
                    comentario="Ingreso proveedor"
                )
                logger.info(f"[crear_ingreso_bodega] Historial de estado 'Completado' creado para pedido {pedido.id_p} (historial id: {historial.id_hist_ped})")
            except Exception as e:
                logger.error(f"[crear_ingreso_bodega] ERROR al crear historial de estado 'Completado' para pedido {pedido.id_p}: {str(e)}")
            
            # Procesar productos y agregarlos al inventario
            productos_agregados = []
            for producto_info in productos_data:
                try:
                    resultado = procesar_producto_ingreso(producto_info, bodega, proveedor_obj, request)
                    productos_agregados.append(resultado)

                    # Obtener el producto real usado (por ID/codigo_interno)
                    producto_real = None
                    if resultado.get('codigo_interno'):
                        try:
                            producto_real = Productos.objects.get(codigo_interno=resultado['codigo_interno'], activo=True)
                        except Productos.DoesNotExist:
                            producto_real = None
                    # Crear detalle del pedido SOLO si se encontró el producto
                    if producto_real:
                        DetallePedido.objects.create(
                            cantidad=producto_info.get('cantidad', 0),
                            descripcion=f"Producto de ingreso: {producto_info.get('nombre', '')}",
                            productos_pedido_fk=producto_real,
                            pedidos_fk=pedido
                        )
                    else:
                        logger.warning(f"No se pudo encontrar producto para detalle con código interno {resultado.get('codigo_interno')}")
                except Exception as e:
                    logger.error(f"Error procesando producto {producto_info.get('nombre', '')}: {str(e)}")
                    continue
            
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
            

            HistorialEstadoPedido.objects.create(
                pedido_fk=pedido,
                estado_anterior=None,
                estado_nuevo=estado_completado,
                usuario_fk=request.user if hasattr(request, 'user') else None,
                comentario="Ingreso proveedor: estado Completado"
            )
            
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
            descripcion = request.data.get('descripcion_psn', 'Transportista')
            
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
                descripcion_psn=descripcion,
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
    pagination_class = None

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

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        # Solo notificaciones del usuario autenticado
        return Notificacion.objects.filter(usuario_fk=self.request.user)

    @action(detail=True, methods=['patch'], url_path='leer')
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        return Response({'status': 'notificación marcada como leída'})

class UsuarioNotificacionListView(generics.ListAPIView):
    serializer_class = UsuarioNotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ajusta esto si usas el modelo de usuario de Django
        return UsuarioNotificacion.objects.filter(usuario=self.request.user, eliminada=False).order_by('-fecha_recibida')

class UsuarioNotificacionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UsuarioNotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id_ntf_us'

    def get_queryset(self):
        return UsuarioNotificacion.objects.filter(usuario=self.request.user)

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
class BodegaCentralViewSet(viewsets.ModelViewSet):
    queryset = BodegaCentral.objects.all()
    serializer_class = BodegaCentralSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

def generar_qr_producto(codigo_interno):
    """Genera un código QR para un producto usando solo el código interno"""
    # Usar solo el código interno para evitar problemas con IDs automáticos
    data = f"PROD:{codigo_interno}"
    
    # Crear QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Crear imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir a base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

@api_view(['GET'])
@permission_classes([AllowAny])
def generar_qr_producto_view(request, producto_id):
    """Endpoint para generar QR de un producto específico"""
    try:
        producto = Productos.objects.get(id_prodc=producto_id)
        qr_base64 = generar_qr_producto(producto.codigo_interno)
        
        return Response({
            'qr_code': qr_base64,
            'producto': {
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo_interno': producto.codigo_interno,
                'descripcion': producto.descripcion_prodc
            }
        })
    except Productos.DoesNotExist:
        return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def producto_por_codigo(request, codigo_interno):
    """Endpoint para obtener producto por código interno (usado en escaneo móvil)"""
    try:
        # Limpiar el código interno de espacios y caracteres especiales
        codigo_limpio = codigo_interno.strip().upper()
        
        # Buscar producto por código interno
        producto = Productos.objects.get(codigo_interno=codigo_limpio, activo=True)
        
        # Obtener stock actual
        stock_actual = 0
        stock_minimo = 0
        ubicacion = None
        
        try:
            stock_obj = Stock.objects.get(productos_fk=producto)
            stock_actual = float(stock_obj.stock)
            stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
            
            # Determinar ubicación
            if stock_obj.bodega_fk:
                try:
                    bodega = BodegaCentral.objects.get(id_bdg=stock_obj.bodega_fk)
                    ubicacion = f"Bodega: {bodega.nombre_bdg}"
                except BodegaCentral.DoesNotExist:
                    ubicacion = "Bodega Central"
            elif stock_obj.sucursal_fk:
                try:
                    sucursal = Sucursal.objects.get(id=stock_obj.sucursal_fk)
                    ubicacion = f"Sucursal: {sucursal.nombre_sucursal}"
                except Sucursal.DoesNotExist:
                    ubicacion = "Sucursal"
        except Stock.DoesNotExist:
            ubicacion = "Sin ubicación asignada"
        
        # Determinar estado del stock
        if stock_actual <= 0:
            estado_stock = 'SIN_STOCK'
            color_estado = '#ff4444'
        elif stock_actual <= stock_minimo:
            estado_stock = 'CRÍTICO'
            color_estado = '#ff8800'
        elif stock_actual <= stock_minimo * 1.5:
            estado_stock = 'BAJO'
            color_estado = '#ffaa00'
        else:
            estado_stock = 'NORMAL'
            color_estado = '#00aa00'
        
        return Response({
            'producto': {
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo_interno': producto.codigo_interno,
                'descripcion': producto.descripcion_prodc,
                'marca': producto.marca_fk.nombre_mprod,
                'categoria': producto.categoria_fk.nombre,
                'stock_actual': stock_actual,
                'stock_minimo': stock_minimo,
                'estado_stock': estado_stock,
                'color_estado': color_estado,
                'ubicacion': ubicacion,
                'fecha_creacion': producto.fecha_creacion.isoformat() if producto.fecha_creacion else None
            }
        })
    except Productos.DoesNotExist:
        return Response({
            'error': 'Producto no encontrado',
            'codigo_buscado': codigo_interno,
            'sugerencia': 'Verifique que el código sea correcto y que el producto esté activo'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Error interno del servidor',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# FUNCIÓN ELIMINADA: actualizar_stock_por_codigo
# Esta función causaba duplicación de movimientos
# Ahora se usa actualizar_stock_con_movimiento que es más específica

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def actualizar_stock_con_movimiento(request, producto_id):
    """
    Endpoint específico para actualizar stock y crear movimiento de inventario
    """
    try:
        nueva_cantidad = request.data.get('stock_write')
        motivo = request.data.get('motivo', 'Sin motivo especificado')
        
        if nueva_cantidad is None:
            return Response({
                'error': 'Stock es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar cantidad
        try:
            cantidad_nueva = float(nueva_cantidad)
            if cantidad_nueva < 0:
                return Response({
                    'error': 'La cantidad no puede ser negativa'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'error': 'La cantidad debe ser un número válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener producto
        try:
            producto = Productos.objects.get(id_prodc=producto_id, activo=True)
        except Productos.DoesNotExist:
            return Response({
                'error': 'Producto no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener stock actual - manejar múltiples registros
        stock_obj = None
        sucursal_id = getattr(request.user, 'sucursal_fk_id', None) or request.data.get('sucursal_id')
        bodega_id = getattr(request.user, 'bodeg_fk_id', None) or request.data.get('bodega_id')
        if sucursal_id:
            stock_obj = Stock.objects.filter(productos_fk=producto, sucursal_fk=sucursal_id).order_by('-id_stock').first()
        elif bodega_id:
            stock_obj = Stock.objects.filter(productos_fk=producto, bodega_fk=bodega_id).order_by('-id_stock').first()
        else:
            # Fallback: buscar cualquier stock del producto
            stock_obj = Stock.objects.filter(productos_fk=producto).order_by('-id_stock').first()
        if not stock_obj:
            # Si no existe, crear uno nuevo para la sucursal o bodega correspondiente
            stock_obj = Stock.objects.create(
                productos_fk=producto,
                stock=0,
                stock_minimo=0,
                stock_maximo=0,
                sucursal_fk=sucursal_id if sucursal_id else None,
                bodega_fk=bodega_id if bodega_id else None
            )
            logger.info(f"✅ Nuevo registro de Stock creado para producto {producto.id_prodc} en sucursal {sucursal_id} o bodega {bodega_id}")
        cantidad_actual = float(stock_obj.stock)
        
        # Solo crear movimiento si hay cambio en el stock
        if cantidad_nueva != cantidad_actual:
            # Calcular la cantidad del movimiento
            cantidad_movimiento = cantidad_nueva - cantidad_actual
            
            logger.info(f"🔍 DEBUG - Creando movimiento: Stock actual={cantidad_actual}, Stock nuevo={cantidad_nueva}, Cantidad movimiento={cantidad_movimiento}")
            
            # Crear el movimiento de inventario
            movimiento = MovInventario.objects.create(
                cantidad=cantidad_movimiento,
                fecha=timezone.now(),
                productos_fk=producto,
                usuario_fk=request.user,
                motivo=motivo,
                stock_fk=stock_obj  # <-- NUEVO: referencia al stock de la ubicación
            )
            
            # Actualizar stock
            stock_obj.stock = cantidad_nueva
            stock_obj.save()
            
            logger.info(f"✅ Movimiento registrado: ID={movimiento.id_mvin}, Stock {cantidad_actual}→{cantidad_nueva}, Cantidad={cantidad_movimiento}, Motivo='{motivo}', Usuario={request.user.nombre}")
        else:
            logger.info(f"ℹ️ No se creó movimiento: stock no cambió ({cantidad_actual})")
        
        return Response({
            'mensaje': 'Stock actualizado correctamente',
            'producto': {
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo_interno': producto.codigo_interno,
                'stock_anterior': cantidad_actual,
                'stock_nuevo': cantidad_nueva,
                'movimiento_creado': cantidad_nueva != cantidad_actual,
                'fecha_actualizacion': timezone.now().isoformat(),
                'motivo': motivo
            }
        })
        
    except Exception as e:
        logger.error(f"Error actualizando stock con movimiento: {str(e)}")
        return Response({
            'error': 'Error interno del servidor',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def lista_productos_qr(request):
    """Endpoint para obtener lista de productos con QR (para impresión)"""
    try:
        productos = Productos.objects.filter(activo=True)
        productos_con_qr = []
        
        for producto in productos:
            qr_base64 = generar_qr_producto(producto.codigo_interno)
            productos_con_qr.append({
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo_interno': producto.codigo_interno,
                'qr_code': qr_base64
            })
        
        return Response({'productos': productos_con_qr})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def validar_codigo_producto(request, codigo_interno):
    """Endpoint para validar si un código de producto existe y está activo"""
    try:
        # Limpiar el código interno
        codigo_limpio = codigo_interno.strip().upper()
        
        # Verificar si existe el producto
        producto = Productos.objects.get(codigo_interno=codigo_limpio, activo=True)
        
        return Response({
            'valido': True,
            'producto': {
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo_interno': producto.codigo_interno,
                'marca': producto.marca_fk.nombre_mprod,
                'categoria': producto.categoria_fk.nombre
            }
        })
    except Productos.DoesNotExist:
        return Response({
            'valido': False,
            'error': 'Producto no encontrado',
            'codigo_buscado': codigo_interno
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'valido': False,
            'error': 'Error interno del servidor',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_codigo_interno(producto, bodega):
    """
    Genera un código interno único para el producto
    Formato: {CAT}-{YYYYMM}-{NNN}
    Ejemplo: FER-202406-001
    """
    try:
        # Obtener prefijo de categoría (primeras 3 letras)
        categoria_prefijo = producto.categoria_fk.nombre[:3].upper()
        
        # Obtener fecha actual en formato YYYYMM
        fecha_actual = timezone.now().strftime('%Y%m')
        
        # Buscar el último número usado para esta categoría en este mes
        ultimo_producto = Productos.objects.filter(
            codigo_interno__startswith=f'{categoria_prefijo}-{fecha_actual}-',
            bodega_fk=bodega
        ).order_by('-codigo_interno').first()
        
        if ultimo_producto:
            # Extraer el número del último código
            try:
                ultimo_numero = int(ultimo_producto.codigo_interno.split('-')[-1])
                nuevo_numero = ultimo_numero + 1
            except (ValueError, IndexError):
                nuevo_numero = 1
        else:
            nuevo_numero = 1
        
        # Formatear el código
        codigo = f'{categoria_prefijo}-{fecha_actual}-{nuevo_numero:03d}'
        
        logger.info(f"Código generado para {producto.nombre_prodc}: {codigo}")
        return codigo
        
    except Exception as e:
        logger.error(f"Error generando código para {producto.nombre_prodc}: {str(e)}")
        # Fallback: usar timestamp
        return f'PROD-{int(timezone.now().timestamp())}'

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verificar_producto_existente(request):
    """
    Verifica si un producto ya existe en la base de datos
    """
    try:
        nombre = request.data.get('nombre')
        marca = request.data.get('marca')
        categoria = request.data.get('categoria')
        bodega_id = request.data.get('bodega_id')
        
        if not all([nombre, marca, categoria, bodega_id]):
            return Response({
                'error': 'Todos los campos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar producto existente
        try:
            producto = Productos.objects.get(
                nombre_prodc__iexact=nombre,
                marca_fk__nombre_mprod__iexact=marca,
                categoria_fk__nombre__iexact=categoria,
                bodega_fk=bodega_id
            )
            
            # Obtener stock actual
            stock_obj = Stock.objects.filter(
                productos_fk=producto,
                bodega_fk=bodega_id
            ).first()
            
            return Response({
                'existe': True,
                'producto': {
                    'id': producto.id_prodc,
                    'nombre': producto.nombre_prodc,
                    'codigo_interno': producto.codigo_interno,
                    'stock_actual': float(stock_obj.stock) if stock_obj else 0,
                    'stock_minimo': float(stock_obj.stock_minimo) if stock_obj and stock_obj.stock_minimo else 0,
                    'stock_maximo': float(stock_obj.stock_maximo) if stock_obj and stock_obj.stock_maximo else 0
                }
            })
            
        except Productos.DoesNotExist:
            return Response({
                'existe': False,
                'mensaje': 'Producto no encontrado'
            })
            
    except Exception as e:
        logger.error(f"Error verificando producto: {str(e)}")
        return Response({
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def extraer_modelo_desde_nombre(nombre):
    """
    Extrae una variante/modelo relevante del nombre del producto (ej: 10m, 500ml, 2L, 500W, 220V, 1HP, 1/2", 16mm, 10'', etc.)
    Si no encuentra, retorna 'GEN'.
    """
    patrones = [
        r"(\d+\s?(m|ml|l|kg|g|cm|mm|pcs|un|lt|mts|mt|x\d+))",  # Medidas y cantidades
        r"(\d+\s?(w|kw|hp|v|ah|hz|rpm|bar|psi|amp|a|kva|kcal|btu))",  # Potencias, voltajes, energía
        r"(\d+/\d+\s?\"|\d+\s?\"|\d+/\d+\s?''|\d+\s?'')",  # Fracciones y pulgadas (doble y simple)
        r"(\d+\s?mm|\d+\s?cm|\d+\s?m)",  # Milímetros, centímetros, metros
        r"(rojo|azul|verde|negro|blanco|amarillo|gris|naranja|madera|inox|cobre|plata|dorado|transparente|beige|marrón|morado|celeste|turquesa|ocre|pino|nogal|grafito|acero|galvanizado|zinc)",  # Colores y materiales
        r"(grande|pequeño|mediano|extra|mini|maxi|compacto|industrial|profesional|hogar|básico|premium)",  # Tamaños y calidades
        r"(\d+\s?kg|\d+\s?g|\d+\s?lb|\d+\s?ton)",  # Pesos
        r"(\d+\s?ml|\d+\s?l|\d+\s?cc)",  # Volúmenes
        r"(\d+\s?panel|\d+\s?placa|\d+\s?rollo|\d+\s?bolsa|\d+\s?caja|\d+\s?bulto|\d+\s?barril|\d+\s?galón)",  # Unidades de empaque
    ]
    for patron in patrones:
        match = re.search(patron, nombre, re.IGNORECASE)
        if match:
            return match.group(0).replace(' ', '').upper()
    return 'GEN'

def generate_codigo_unico(nombre, marca, categoria, modelo, bodega=None, sucursal=None):
    """
    Genera un código único basado en características del producto
    Formato: {CAT}-{MARCA}-{MODELO}-{YYYYMM}-{NNN}
    Ejemplo: FERR-STAN-500W-202406-001
    El correlativo NNN es único por bodega/sucursal, categoría, marca y modelo
    """
    try:
        categoria_prefijo = categoria[:4].upper() if categoria else 'GEN'
        marca_prefijo = marca[:4].upper() if marca else 'GEN'
        if not modelo or modelo.strip() == '':
            modelo_prefijo = extraer_modelo_desde_nombre(nombre)
        else:
            modelo_prefijo = modelo[:4].upper()
        fecha_actual = timezone.now().strftime('%Y%m')
        patron = f'{categoria_prefijo}-{marca_prefijo}-{modelo_prefijo}-{fecha_actual}'
        # Filtro por bodega o sucursal
        filtro_ubicacion = {}
        if bodega:
            filtro_ubicacion['bodega_fk'] = bodega
        if sucursal:
            filtro_ubicacion['sucursal_fk'] = sucursal
        # Buscar último número para esta combinación en la ubicación
        ultimo_producto = Productos.objects.filter(
            codigo_interno__startswith=patron,
            categoria_fk__nombre__iexact=categoria,
            marca_fk__nombre_mprod__iexact=marca,
            **filtro_ubicacion
        ).order_by('-codigo_interno').first()
        if ultimo_producto:
            try:
                ultimo_numero = int(ultimo_producto.codigo_interno.split('-')[-1])
                nuevo_numero = ultimo_numero + 1
            except (ValueError, IndexError):
                nuevo_numero = 1
        else:
            nuevo_numero = 1
        codigo = f'{patron}-{nuevo_numero:03d}'
        logger.info(f"Código único generado para {nombre}: {codigo}")
        return codigo
    except Exception as e:
        logger.error(f"Error generando código único para {nombre}: {str(e)}")
        return f'PROD-{int(timezone.now().timestamp())}'

def buscar_producto_por_codigo(codigo_interno, bodega):
    """
    Busca un producto por su código interno único
    """
    try:
        producto = Productos.objects.get(
            codigo_interno=codigo_interno,
            bodega_fk=bodega
        )
        return producto
    except Productos.DoesNotExist:
        return None

def procesar_producto_ingreso(producto_data, bodega, proveedor, request):
    nombre = producto_data.get('nombre', '')
    marca_nombre = producto_data.get('marca', '')
    categoria_nombre = producto_data.get('categoria', '')
    modelo = producto_data.get('modelo', '')  # Nuevo campo
    cantidad = producto_data.get('cantidad', 0)
    es_producto_existente = producto_data.get('es_producto_existente', False)
    producto_id_existente = producto_data.get('id')  # ID del producto existente seleccionado
    codigo_interno = producto_data.get('codigo_interno')

    # Nueva validación diferenciada
    if es_producto_existente:
        if not producto_id_existente or cantidad <= 0:
            raise ValueError("Datos incompletos para producto existente: id y cantidad requeridos")
        # Cargar el producto existente por ID:
        try:
            producto = Productos.objects.get(id_prodc=producto_id_existente, activo=True)
        except Productos.DoesNotExist:
            raise ValueError(f"Producto existente con ID {producto_id_existente} no encontrado")
        # Sumar stock en la bodega correspondiente
        stock_obj, _ = Stock.objects.get_or_create(
            productos_fk=producto,
            bodega_fk=bodega.id_bdg,
            defaults={
                'stock': 0,
                'stock_minimo': 5,
                'stock_maximo': 100,
                'sucursal_fk': None,
                'proveedor_fk': None
            }
        )
        stock_obj.stock += cantidad
        stock_obj.save()
        # Registrar movimiento de inventario
        MovInventario.objects.create(
            cantidad=cantidad,
            fecha=timezone.now(),
            productos_fk=producto,
            usuario_fk=request.user,
            motivo='Ingreso por pedido'
        )
        return {
            'producto': producto.nombre_prodc,
            'codigo_interno': producto.codigo_interno,
            'cantidad': float(cantidad),
            'stock_actual': float(stock_obj.stock),
            'marca': producto.marca_fk.nombre_mprod,
            'categoria': producto.categoria_fk.nombre,
            'modelo': modelo,
            'es_nuevo': False
        }
    else:
        if not nombre or not marca_nombre or not categoria_nombre or cantidad <= 0:
            raise ValueError(f"Datos incompletos para producto: {nombre}")

        # Buscar o crear marca
        marca, created = Marca.objects.get_or_create(
            nombre_mprod=marca_nombre,
            defaults={'descripcion_mprod': f'Marca {marca_nombre}'}
        )

        # Buscar o crear categoría
        categoria, created = Categoria.objects.get_or_create(
            nombre=categoria_nombre,
            defaults={'descripcion': f'Categoría {categoria_nombre}'}
        )

        # Generar código único
        codigo_unico = generate_codigo_unico(nombre, marca_nombre, categoria_nombre, modelo, bodega)

        # Verificar si ya existe un producto con este código
        producto_existente = buscar_producto_por_codigo(codigo_unico, bodega)

        if producto_existente:
            # Producto existe, solo actualizar stock
            producto = producto_existente
        else:
            # Crear nuevo producto con código único
            producto = Productos.objects.create(
                nombre_prodc=nombre,
                marca_fk=marca,
                categoria_fk=categoria,
                bodega_fk=bodega,
                descripcion_prodc=f'{nombre} - {marca_nombre} - {categoria_nombre} - {modelo}',
                codigo_interno=codigo_unico,
                fecha_creacion=timezone.now(),
                sucursal_fk=None
            )

        # Buscar o crear el stock para este producto en la bodega
        stock_obj, _ = Stock.objects.get_or_create(
            productos_fk=producto,
            bodega_fk=bodega.id_bdg,
            defaults={
                'stock': 0,
                'stock_minimo': 5,
                'stock_maximo': 100,
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
            usuario_fk=request.user,
            motivo='Ingreso por pedido'
        )

        return {
            'producto': producto.nombre_prodc,
            'codigo_interno': producto.codigo_interno,
            'cantidad': float(cantidad),
            'stock_actual': float(stock_obj.stock),
            'marca': producto.marca_fk.nombre_mprod,
            'categoria': producto.categoria_fk.nombre,
            'modelo': modelo,
            'es_nuevo': not es_producto_existente
        }

# Reemplazar la función anterior
def generate_codigo_interno(producto, bodega):
    """
    Función legacy - mantener por compatibilidad
    """
    return generate_codigo_unico(
        producto.nombre_prodc,
        producto.marca_fk.nombre_mprod,
        producto.categoria_fk.nombre,
        '',  # Sin modelo para compatibilidad
        bodega
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_codigo_automatico(request):
    """Endpoint para generar código automático basado en características del producto"""
    try:
        data = request.data
        nombre = data.get('nombre', '').strip()
        marca = data.get('marca', '').strip()
        categoria = data.get('categoria', '').strip()
        modelo = data.get('modelo', '').strip()
        ubicacion_id = data.get('ubicacion_id')
        es_bodega = data.get('es_bodega', False)
        
        if not nombre or not marca or not categoria:
            return Response({
                'error': 'Nombre, marca y categoría son obligatorios'
            }, status=400)
        
        # Determinar bodega o sucursal
        bodega = None
        sucursal = None
        
        if es_bodega:
            try:
                # Convertir ubicacion_id a entero si es necesario
                ubicacion_id_int = int(ubicacion_id) if ubicacion_id else 2
                bodega = BodegaCentral.objects.get(id_bdg=ubicacion_id_int)
            except (ValueError, BodegaCentral.DoesNotExist):
                # Si no se puede convertir o no existe, usar la bodega central por defecto
                try:
                    bodega = BodegaCentral.objects.get(id_bdg=2)
                except BodegaCentral.DoesNotExist:
                    return Response({
                        'error': 'Bodega central no encontrada'
                    }, status=404)
        else:
            try:
                # Convertir ubicacion_id a entero si es necesario
                ubicacion_id_int = int(ubicacion_id) if ubicacion_id else None
                if ubicacion_id_int:
                    sucursal = Sucursal.objects.get(id_suc=ubicacion_id_int)
                else:
                    return Response({
                        'error': 'ID de sucursal requerido'
                    }, status=400)
            except (ValueError, Sucursal.DoesNotExist):
                return Response({
                    'error': 'Sucursal no encontrada'
                }, status=404)
        
        # Generar código único
        codigo_generado = generate_codigo_unico(
            nombre=nombre,
            marca=marca,
            categoria=categoria,
            modelo=modelo,
            bodega=bodega,
            sucursal=sucursal
        )
        
        return Response({
            'codigo': codigo_generado,
            'nombre': nombre,
            'marca': marca,
            'categoria': categoria,
            'modelo': modelo
        })
        
    except Exception as e:
        logger.error(f"Error generando código automático: {str(e)}")
        return Response({
            'error': 'Error interno del servidor'
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def producto_por_codigo_unico(request, codigo_interno):
    """Endpoint para obtener producto por código interno único"""
    try:
        # Limpiar el código interno
        codigo_limpio = codigo_interno.strip().upper()
        
        # Buscar producto por código interno
        producto = Productos.objects.get(codigo_interno=codigo_limpio, activo=True)
        
        # Obtener stock actual
        stock_actual = 0
        stock_minimo = 0
        stock_maximo = 0
        ubicacion = None
        
        try:
            stock_obj = Stock.objects.get(productos_fk=producto)
            stock_actual = float(stock_obj.stock)
            stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
            stock_maximo = float(stock_obj.stock_maximo) if stock_obj.stock_maximo else 0
            
            # Determinar ubicación
            if stock_obj.bodega_fk:
                try:
                    bodega = BodegaCentral.objects.get(id_bdg=stock_obj.bodega_fk)
                    ubicacion = f"Bodega: {bodega.nombre_bdg}"
                except BodegaCentral.DoesNotExist:
                    ubicacion = "Bodega Central"
            elif stock_obj.sucursal_fk:
                try:
                    sucursal = Sucursal.objects.get(id=stock_obj.sucursal_fk)
                    ubicacion = f"Sucursal: {sucursal.nombre_sucursal}"
                except Sucursal.DoesNotExist:
                    ubicacion = "Sucursal"
        except Stock.DoesNotExist:
            ubicacion = "Sin ubicación asignada"
        
        # Determinar estado del stock
        if stock_actual <= 0:
            estado_stock = 'SIN_STOCK'
            color_estado = '#ff4444'
        elif stock_actual <= stock_minimo:
            estado_stock = 'CRÍTICO'
            color_estado = '#ff8800'
        elif stock_actual <= stock_minimo * 1.5:
            estado_stock = 'BAJO'
            color_estado = '#ffaa00'
        elif stock_maximo and stock_actual > stock_maximo:
            estado_stock = 'SOBRE_STOCK'
            color_estado = '#4caf50'
        else:
            estado_stock = 'NORMAL'
            color_estado = '#00aa00'
        
        return Response({
            'producto': {
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo_interno': producto.codigo_interno,
                'descripcion': producto.descripcion_prodc,
                'marca': producto.marca_fk.nombre_mprod,
                'categoria': producto.categoria_fk.nombre,
                'stock_actual': stock_actual,
                'stock_minimo': stock_minimo,
                'stock_maximo': stock_maximo,
                'estado_stock': estado_stock,
                'color_estado': color_estado,
                'ubicacion': ubicacion,
                'fecha_creacion': producto.fecha_creacion.isoformat() if producto.fecha_creacion else None
            }
        })
    except Productos.DoesNotExist:
        return Response({
            'error': 'Producto no encontrado',
            'codigo_buscado': codigo_interno,
            'sugerencia': 'Verifique que el código sea correcto y que el producto esté activo'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Error interno del servidor',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def buscar_productos_similares(nombre, marca, categoria, bodega, codigo_interno=None, modelo=None):
    """
    Busca productos similares con prioridad correcta:
    1. Coincidencia exacta por código interno (máxima prioridad)
    2. Coincidencia exacta por nombre (alta prioridad)
    3. Coincidencia por nombre, marca y categoría (baja prioridad)
    """
    try:
        queryset = Productos.objects.filter(bodega_fk=bodega, activo=True)
        productos_con_stock = []
        
        # 1. PRIORIDAD MÁXIMA: Buscar por código interno exacto si se proporciona
        if codigo_interno:
            productos_similares = queryset.filter(codigo_interno=codigo_interno)
            if productos_similares.exists():
                for producto in productos_similares[:10]:
                    try:
                        stock_obj = Stock.objects.get(productos_fk=producto, bodega_fk=bodega.id_bdg)
                        stock_actual = float(stock_obj.stock)
                        stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
                        stock_maximo = float(stock_obj.stock_maximo) if stock_obj.stock_maximo else 0
                    except Stock.DoesNotExist:
                        stock_actual = 0
                        stock_minimo = 0
                        stock_maximo = 0
                    productos_con_stock.append({
                        'id': producto.id_prodc,
                        'nombre': producto.nombre_prodc,
                        'codigo_interno': producto.codigo_interno,
                        'marca': producto.marca_fk.nombre_mprod,
                        'categoria': producto.categoria_fk.nombre,
                        'descripcion': producto.descripcion_prodc,
                        'stock_actual': stock_actual,
                        'stock_minimo': stock_minimo,
                        'stock_maximo': stock_maximo,
                        'fecha_creacion': producto.fecha_creacion.isoformat() if producto.fecha_creacion else None
                    })
                return productos_con_stock
        
        # 2. PRIORIDAD ALTA: Coincidencia exacta por nombre (sin importar marca/categoría)
        nombre_normalizado = nombre.strip().lower()
        productos_similares = queryset.filter(
            nombre_prodc__iexact=nombre_normalizado
        )
        
        # Si encontramos productos con el mismo nombre, los retornamos
        if productos_similares.exists():
            for producto in productos_similares[:10]:
                try:
                    stock_obj = Stock.objects.get(productos_fk=producto, bodega_fk=bodega.id_bdg)
                    stock_actual = float(stock_obj.stock)
                    stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
                    stock_maximo = float(stock_obj.stock_maximo) if stock_obj.stock_maximo else 0
                except Stock.DoesNotExist:
                    stock_actual = 0
                    stock_minimo = 0
                    stock_maximo = 0
                productos_con_stock.append({
                    'id': producto.id_prodc,
                    'nombre': producto.nombre_prodc,
                    'codigo_interno': producto.codigo_interno,
                    'marca': producto.marca_fk.nombre_mprod,
                    'categoria': producto.categoria_fk.nombre,
                    'descripcion': producto.descripcion_prodc,
                    'stock_actual': stock_actual,
                    'stock_minimo': stock_minimo,
                    'stock_maximo': stock_maximo,
                    'fecha_creacion': producto.fecha_creacion.isoformat() if producto.fecha_creacion else None
                })
            return productos_con_stock
        
        # 3. PRIORIDAD BAJA: Solo si no encontramos por nombre, buscar por marca y categoría
        if marca and categoria:
            productos_similares = queryset.filter(
                marca_fk__nombre_mprod__iexact=marca.strip().lower(),
                categoria_fk__nombre__iexact=categoria.strip().lower()
            )
            for producto in productos_similares[:10]:
                try:
                    stock_obj = Stock.objects.get(productos_fk=producto, bodega_fk=bodega.id_bdg)
                    stock_actual = float(stock_obj.stock)
                    stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
                    stock_maximo = float(stock_obj.stock_maximo) if stock_obj.stock_maximo else 0
                except Stock.DoesNotExist:
                    stock_actual = 0
                    stock_minimo = 0
                    stock_maximo = 0
                productos_con_stock.append({
                    'id': producto.id_prodc,
                    'nombre': producto.nombre_prodc,
                    'codigo_interno': producto.codigo_interno,
                    'marca': producto.marca_fk.nombre_mprod,
                    'categoria': producto.categoria_fk.nombre,
                    'descripcion': producto.descripcion_prodc,
                    'stock_actual': stock_actual,
                    'stock_minimo': stock_minimo,
                    'stock_maximo': stock_maximo,
                    'fecha_creacion': producto.fecha_creacion.isoformat() if producto.fecha_creacion else None
                })
        
        return productos_con_stock
    except Exception as e:
        logger.error(f"Error buscando productos similares: {str(e)}")
        return []

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def buscar_productos_similares_endpoint(request):
    """
    Endpoint para buscar productos similares
    """
    try:
        nombre = request.data.get('nombre', '')
        marca = request.data.get('marca', '')
        categoria = request.data.get('categoria', '')
        bodega_id = request.data.get('bodega_id')
        codigo_interno = request.data.get('codigo_interno', None)
        modelo = request.data.get('modelo', None)
        if not nombre or not bodega_id:
            return Response({
                'error': 'Nombre y bodega_id son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            bodega = BodegaCentral.objects.get(id_bdg=bodega_id)
        except BodegaCentral.DoesNotExist:
            return Response({
                'error': 'Bodega no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        productos_similares_ids = buscar_productos_similares(nombre, marca, categoria, bodega, codigo_interno, modelo)
        # Obtener los productos por ID
        productos_queryset = Productos.objects.filter(codigo_interno__in=[p['codigo_interno'] for p in productos_similares_ids])
        serializer = ProductoBodegaSerializer(productos_queryset, many=True, context={'request': request})
        productos_serializados = serializer.data
        return Response({
            'productos_similares': productos_serializados,
            'total_encontrados': len(productos_serializados)
        })
    except Exception as e:
        logger.error(f"Error en endpoint buscar_productos_similares: {str(e)}")
        return Response({
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






@api_view(['GET'])
@permission_classes([IsAuthenticated])
def movimientos_inventario(request):
    """
    Lista los movimientos de inventario con filtros avanzados y estadísticas.
    """
    # Filtros básicos
    bodega_id = request.GET.get('bodega')
    sucursal_id = request.GET.get('sucursal')
    producto_id = request.GET.get('producto')
    usuario_id = request.GET.get('usuario')
    
    # Filtros avanzados
    tipo_movimiento = request.GET.get('tipo_movimiento')  # ENTRADA, SALIDA, AJUSTE
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    cantidad_min = request.GET.get('cantidad_min')
    cantidad_max = request.GET.get('cantidad_max')
    
    # Paginación
    limit = int(request.GET.get('limit', 200))
    offset = int(request.GET.get('offset', 0))

    queryset = MovInventario.objects.all().select_related(
        'productos_fk', 'usuario_fk', 'productos_fk__bodega_fk', 'productos_fk__sucursal_fk'
    )

    # Aplicar filtros
    if sucursal_id:
        stocks_en_sucursal = Stock.objects.filter(sucursal_fk=sucursal_id).values_list('id_stock', flat=True)
        queryset = queryset.filter(stock_fk__in=stocks_en_sucursal)
    elif bodega_id:
        stocks_en_bodega = Stock.objects.filter(bodega_fk=bodega_id).values_list('id_stock', flat=True)
        queryset = queryset.filter(stock_fk__in=stocks_en_bodega)
    queryset = queryset.exclude(stock_fk__isnull=True)
    if producto_id:
        queryset = queryset.filter(productos_fk__id_prodc=producto_id)
    if usuario_id:
        queryset = queryset.filter(usuario_fk__id_us=usuario_id)
    if fecha_inicio:
        queryset = queryset.filter(fecha__gte=fecha_inicio)
    if fecha_fin:
        queryset = queryset.filter(fecha__lte=fecha_fin)
    if cantidad_min:
        queryset = queryset.filter(cantidad__gte=cantidad_min)
    if cantidad_max:
        queryset = queryset.filter(cantidad__lte=cantidad_max)
    if tipo_movimiento:
        if tipo_movimiento == "ENTRADA":
            queryset = queryset.filter(cantidad__gt=0)
        elif tipo_movimiento == "SALIDA":
            queryset = queryset.filter(cantidad__lt=0)
        elif tipo_movimiento == "AJUSTE":
            queryset = queryset.filter(cantidad=0)

    # --- Calcula estadísticas ANTES del slicing ---
    total_movimientos = queryset.count()
    total_entradas = queryset.filter(cantidad__gt=0).count()
    total_salidas = queryset.filter(cantidad__lt=0).count()
    total_ajustes = queryset.filter(cantidad=0).count()
    suma_entradas = queryset.filter(cantidad__gt=0).aggregate(
        total=models.Sum('cantidad')
    )['total'] or 0
    suma_salidas = abs(queryset.filter(cantidad__lt=0).aggregate(
        total=models.Sum('cantidad')
    )['total'] or 0)

    # --- FILTRAR DUPLICADOS: dejar solo el movimiento más antiguo por grupo clave ---
    # Agrupar por producto, cantidad, fecha (día), usuario y motivo, y obtener el id_mvin más bajo (más antiguo)
    ids_unicos = queryset.values(
        'productos_fk', 'cantidad', 'fecha', 'usuario_fk', 'motivo'
    ).annotate(
        min_id=Min('id_mvin')
    ).values_list('min_id', flat=True)
    queryset = queryset.filter(id_mvin__in=ids_unicos)

    # --- Solo aquí aplica el slicing para la respuesta ---
    queryset = queryset.order_by('-fecha')[offset:offset + limit]

    serializer = MovInventarioSerializer(queryset, many=True)
    
    # Preparar respuesta con estadísticas
    response_data = {
        'movimientos': serializer.data,
        'estadisticas': {
            'total_movimientos': total_movimientos,
            'entradas': {
                'cantidad': total_entradas,
                'unidades': suma_entradas
            },
            'salidas': {
                'cantidad': total_salidas,
                'unidades': suma_salidas
            },
            'ajustes': {
                'cantidad': total_ajustes,
                'unidades': 0
            },
            'balance': suma_entradas - suma_salidas
        },
        'filtros_aplicados': {
            'bodega': bodega_id,
            'sucursal': sucursal_id,
            'tipo_movimiento': tipo_movimiento,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'limit': limit,
            'offset': offset
        }
    }
    
    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pedidos_recientes(request):
    """
    Endpoint para obtener los pedidos más recientes, con paginación y filtro por tipo (ingreso/salida)
    Parámetros GET:
      - tipo: 'ingreso' o 'salida' (opcional)
      - limit: cantidad de pedidos a devolver (por defecto 10)
      - offset: desde qué posición (por defecto 0)
    """
    tipo = request.GET.get('tipo', None)
    limit = int(request.GET.get('limit', 10))
    offset = int(request.GET.get('offset', 0))
    queryset = Pedidos.objects.all().order_by('-fecha_entrega')
    total = queryset.count()
    pedidos = queryset[offset:offset+limit]
    from .serializers import PedidosSerializer
    serializer = PedidosSerializer(pedidos, many=True)
    return Response({
        'total': total,
        'pedidos': serializer.data
    })

class BuscarProductosSimilaresSucursalView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        nombre = request.data.get('nombre')
        sucursal_id = request.data.get('sucursal_id')
        marca = request.data.get('marca', None)
        categoria = request.data.get('categoria', None)
        codigo_interno = request.data.get('codigo_interno', None)

        if not nombre or not sucursal_id:
            return Response({'error': 'Nombre y sucursal_id son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        productos_con_stock = Stock.objects.filter(
            sucursal_fk=sucursal_id,
            stock__gt=0
        ).values_list('productos_fk', flat=True)

        queryset = Productos.objects.filter(id_prodc__in=productos_con_stock)
        nombre_normalizado = nombre.strip().lower()

        # PRIORIDAD 1: Coincidencia exacta en nombre, código, marca y categoría
        if codigo_interno and marca and categoria:
            productos_similares = queryset.filter(
                nombre_prodc__iexact=nombre_normalizado,
                codigo_interno=codigo_interno,
                marca_fk__nombre_mprod__iexact=marca,
                categoria_fk__nombre__iexact=categoria
            )
            if productos_similares.exists():
                serializer = ProductoSucursalSerializer(productos_similares, many=True, context={'request': request})
                return Response({'productos_similares': serializer.data}, status=status.HTTP_200_OK)

        # PRIORIDAD 2: Nombre exacto
        productos_similares = queryset.filter(nombre_prodc__iexact=nombre_normalizado)
        if productos_similares.exists():
            serializer = ProductoSucursalSerializer(productos_similares, many=True, context={'request': request})
            return Response({'productos_similares': serializer.data}, status=status.HTTP_200_OK)

        # PRIORIDAD 3: Código interno exacto
        if codigo_interno:
            productos_similares = queryset.filter(codigo_interno=codigo_interno)
            if productos_similares.exists():
                serializer = ProductoSucursalSerializer(productos_similares, many=True, context={'request': request})
                return Response({'productos_similares': serializer.data}, status=status.HTTP_200_OK)

        # PRIORIDAD 4: Marca y categoría (icontains)
        if marca and categoria:
            productos_similares = queryset.filter(
                marca_fk__nombre_mprod__icontains=marca,
                categoria_fk__nombre__icontains=categoria
            )
            serializer = ProductoSucursalSerializer(productos_similares, many=True, context={'request': request})
            return Response({'productos_similares': serializer.data}, status=status.HTTP_200_OK)

        return Response({'productos_similares': []}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_producto(request, producto_id):
    """
    Obtiene el historial completo de un producto específico para una ubicación (sucursal o bodega).
    Incluye movimientos de inventario, estadísticas y evolución del stock SOLO para esa ubicación.
    """
    try:
        # Verificar que el producto existe
        try:
            producto = Productos.objects.get(id_prodc=producto_id)
        except Productos.DoesNotExist:
            return Response({
                'error': 'Producto no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Obtener parámetros de ubicación
        sucursal_id = request.GET.get('sucursal_id')
        bodega_id = request.GET.get('bodega_id')
        stock_obj = None
        stock_filter = {'productos_fk': producto}
        ubicacion_str = "Sin ubicación"

        if bodega_id:
            stock_filter['bodega_fk'] = int(bodega_id)
            ubicacion_str = f"Bodega: {BodegaCentral.objects.get(id_bdg=bodega_id).nombre_bdg}"
        elif sucursal_id:
            stock_filter['sucursal_fk'] = int(sucursal_id)
            ubicacion_str = f"Sucursal: {Sucursal.objects.get(id=sucursal_id).nombre_sucursal}"
        # Buscar el registro de stock para la ubicación
        stock_obj = Stock.objects.filter(**stock_filter).first()
        if not stock_obj:
            return Response({'error': 'No existe stock para este producto en la ubicación indicada'}, status=404)

        # Filtrar movimientos SOLO de esa ubicación (por stock_fk)
        movimientos = MovInventario.objects.filter(
            productos_fk=producto,
            stock_fk=stock_obj
        ).select_related('usuario_fk').order_by('-fecha', '-id_mvin')

        movimientos_serializer = MovInventarioSerializer(movimientos, many=True)

        # Calcular estadísticas SOLO de esa ubicación
        total_movimientos = movimientos.count()
        entradas = movimientos.filter(cantidad__gt=0).count()
        salidas = movimientos.filter(cantidad__lt=0).count()
        ajustes = movimientos.filter(cantidad=0).count()
        suma_entradas = movimientos.filter(cantidad__gt=0).aggregate(total=models.Sum('cantidad'))['total'] or 0
        suma_salidas = abs(movimientos.filter(cantidad__lt=0).aggregate(total=models.Sum('cantidad'))['total'] or 0)

        # Stock actual de la ubicación
        stock_actual = float(stock_obj.stock)
        stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
        stock_maximo = float(stock_obj.stock_maximo) if stock_obj.stock_maximo else 0

        # Timeline SOLO con movimientos de esa ubicación
        timeline = []
        movimientos_ordenados = list(movimientos.order_by('-fecha', '-id_mvin'))
        stock_acumulado = stock_actual
        for mov in movimientos_ordenados:
            stock_despues = stock_acumulado
            stock_antes = stock_despues - mov.cantidad
            timeline.append({
                'fecha': mov.fecha.isoformat(),
                'tipo': 'ENTRADA' if mov.cantidad > 0 else 'SALIDA' if mov.cantidad < 0 else 'AJUSTE',
                'cantidad': abs(mov.cantidad),
                'motivo': mov.motivo or 'Sin motivo especificado',
                'usuario': mov.usuario_fk.nombre,
                'stock_antes': stock_antes,
                'stock_despues': stock_despues,
                'icono': '📥' if mov.cantidad > 0 else '📤' if mov.cantidad < 0 else '⚙️',
                'color': '#4CAF50' if mov.cantidad > 0 else '#F44336' if mov.cantidad < 0 else '#FF9800'
            })
            stock_acumulado = stock_antes
        stock_actual_final = timeline[0]['stock_despues'] if timeline else stock_actual

        producto_info = {
            'id_prodc': producto.id_prodc,
            'nombre_prodc': producto.nombre_prodc,
            'codigo_interno': producto.codigo_interno,
            'descripcion_prodc': producto.descripcion_prodc,
            'marca': producto.marca_fk.nombre_mprod if producto.marca_fk else 'Sin marca',
            'categoria': producto.categoria_fk.nombre if producto.categoria_fk else 'Sin categoría',
            'fecha_creacion': producto.fecha_creacion.isoformat() if producto.fecha_creacion else None,
            'ubicacion': ubicacion_str,
            'stock_actual': stock_actual_final,
            'stock_minimo': stock_minimo,
            'stock_maximo': stock_maximo,
        }

        estadisticas_producto = {
            'total_movimientos': total_movimientos,
            'entradas': {
                'cantidad': entradas,
                'unidades': suma_entradas
            },
            'salidas': {
                'cantidad': salidas,
                'unidades': suma_salidas
            },
            'ajustes': {
                'cantidad': ajustes,
                'unidades': 0
            },
            'balance_total': suma_entradas - suma_salidas,
            'promedio_movimientos_mes': total_movimientos / max(1, 30) if producto.fecha_creacion else 0
        }

        return Response({
            'producto': producto_info,
            'movimientos': movimientos_serializer.data,
            'timeline': timeline,
            'estadisticas': estadisticas_producto
        })

    except Exception as e:
        logger.error(f"Error obteniendo historial del producto {producto_id}: {str(e)}")
        return Response({
            'error': 'Error interno del servidor',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_con_movimientos_recientes(request):
    """
    Obtiene productos que han tenido movimientos recientes, agrupados por producto.
    Muestra información resumida de cada producto con sus últimos movimientos.
    """
    try:
        # Parámetros de filtrado
        dias_atras = int(request.GET.get('dias', 7))  # Por defecto últimos 7 días
        limit = int(request.GET.get('limit', 10))  # Por defecto 10 productos
        bodega_id = request.GET.get('bodega_id')
        sucursal_id = request.GET.get('sucursal_id')
        
        # Calcular fecha límite
        fecha_limite = timezone.now() - timezone.timedelta(days=dias_atras)
        
        # Obtener productos con movimientos recientes
        movimientos_query = MovInventario.objects.filter(fecha__gte=fecha_limite)
        
        # Filtrar por ubicación si se especifica
        if bodega_id:
            movimientos_query = movimientos_query.filter(
                productos_fk__bodega_fk=bodega_id
            )
            logger.info(f"Filtrando por bodega_id: {bodega_id}")
        elif sucursal_id:
            movimientos_query = movimientos_query.filter(
                productos_fk__sucursal_fk=sucursal_id
            )
            logger.info(f"Filtrando por sucursal_id: {sucursal_id}")
        
        # Obtener productos únicos con movimientos
        productos_con_movimientos = movimientos_query.values('productos_fk').distinct()
        logger.info(f"Productos con movimientos encontrados: {productos_con_movimientos.count()}")
        
        # Obtener los productos
        productos_ids = [item['productos_fk'] for item in productos_con_movimientos]
        productos = Productos.objects.filter(
            id_prodc__in=productos_ids,
            activo=True
        ).select_related('marca_fk', 'categoria_fk', 'bodega_fk', 'sucursal_fk')
        
        # Limitar cantidad de productos
        productos = productos[:limit]
        
        resultado = []
        
        logger.info(f"Procesando {productos.count()} productos")
        
        for producto in productos:
            try:
                logger.info(f"Procesando producto: {producto.id_prodc} - {producto.nombre_prodc}")
                
                # Obtener movimientos recientes del producto
                movimientos_recientes_query = MovInventario.objects.filter(
                    productos_fk=producto,
                    fecha__gte=fecha_limite
                ).select_related('usuario_fk').order_by('-fecha')
            
                # Calcular estadísticas del período ANTES del slice
                total_entradas = movimientos_recientes_query.filter(cantidad__gt=0).aggregate(
                    total=models.Sum('cantidad')
                )['total'] or 0
                total_salidas = abs(movimientos_recientes_query.filter(cantidad__lt=0).aggregate(
                    total=models.Sum('cantidad')
                )['total'] or 0)
                
                # Ahora aplicar el slice para obtener solo los últimos 5 movimientos
                movimientos_recientes = movimientos_recientes_query[:5]
                
                # Obtener stock actual
                stock_actual = 0
                stock_obj = None
                
                if producto.bodega_fk:
                    try:
                        # Usar el ID de la bodega, no el objeto completo
                        bodega_id = producto.bodega_fk.id_bdg if hasattr(producto.bodega_fk, 'id_bdg') else producto.bodega_fk
                        stock_obj = Stock.objects.filter(
                            productos_fk=producto,
                            bodega_fk=bodega_id
                        ).first()
                    except AttributeError:
                        # Si bodega_fk es None o no tiene id_bdg
                        stock_obj = None
                elif producto.sucursal_fk:
                    try:
                        # Usar el ID de la sucursal, no el objeto completo
                        sucursal_id = producto.sucursal_fk.id if hasattr(producto.sucursal_fk, 'id') else producto.sucursal_fk
                        stock_obj = Stock.objects.filter(
                            productos_fk=producto,
                            sucursal_fk=sucursal_id
                        ).first()
                    except AttributeError:
                        # Si sucursal_fk es None o no tiene id
                        stock_obj = None
                else:
                    stock_obj = None

                if stock_obj:
                    stock_actual = float(stock_obj.stock)
                
                # Último movimiento
                ultimo_movimiento = movimientos_recientes.first()
                
                # Serializar movimientos recientes
                movimientos_serializer = MovInventarioSerializer(movimientos_recientes, many=True)
                
                producto_data = {
                    'id_prodc': producto.id_prodc,
                    'nombre_prodc': producto.nombre_prodc,
                    'codigo_interno': producto.codigo_interno,
                    'marca': producto.marca_fk.nombre_mprod if producto.marca_fk and hasattr(producto.marca_fk, 'nombre_mprod') else 'Sin marca',
                    'categoria': producto.categoria_fk.nombre if producto.categoria_fk and hasattr(producto.categoria_fk, 'nombre') else 'Sin categoría',
                    'ubicacion': f"Bodega: {producto.bodega_fk.nombre_bdg}" if producto.bodega_fk and hasattr(producto.bodega_fk, 'nombre_bdg') else f"Sucursal: {producto.sucursal_fk.nombre_sucursal}" if producto.sucursal_fk and hasattr(producto.sucursal_fk, 'nombre_sucursal') else "Sin ubicación",
                    'stock_actual': stock_actual,
                    'stock_minimo': float(stock_obj.stock_minimo) if stock_obj and stock_obj.stock_minimo else 0,
                    'stock_maximo': float(stock_obj.stock_maximo) if stock_obj and stock_obj.stock_maximo else 0,
                    'estadisticas_periodo': {
                        'entradas': total_entradas,
                        'salidas': total_salidas,
                        'balance': total_entradas - total_salidas,
                        'total_movimientos': movimientos_recientes.count()
                    },
                    'ultimo_movimiento': {
                        'fecha': ultimo_movimiento.fecha.isoformat() if ultimo_movimiento else None,
                        'tipo': 'ENTRADA' if ultimo_movimiento and ultimo_movimiento.cantidad > 0 else 'SALIDA' if ultimo_movimiento and ultimo_movimiento.cantidad < 0 else 'AJUSTE',
                        'cantidad': abs(ultimo_movimiento.cantidad) if ultimo_movimiento else 0,
                        'usuario': ultimo_movimiento.usuario_fk.nombre if ultimo_movimiento else None,
                        'motivo': ultimo_movimiento.motivo if ultimo_movimiento else None
                    },
                    'movimientos_recientes': movimientos_serializer.data
                }
                
                resultado.append(producto_data)
            except Exception as e:
                logger.error(f"Error procesando producto {producto.id_prodc}: {str(e)}")
                continue
        
        # Ordenar por fecha del último movimiento (más reciente primero)
        resultado.sort(key=lambda x: x['ultimo_movimiento']['fecha'] or '', reverse=True)
        
        return Response({
            'productos': resultado,
            'filtros_aplicados': {
                'dias_atras': dias_atras,
                'limit': limit,
                'bodega_id': bodega_id,
                'sucursal_id': sucursal_id
            },
            'total_productos': len(resultado)
        })
        
    except Exception as e:
        logger.error(f"Error obteniendo productos con movimientos recientes: {str(e)}")
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        return Response({
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===== ENDPOINTS PARA PRODUCTOS DESACTIVADOS =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_desactivados(request):
    """Obtiene todos los productos desactivados"""
    try:
        # Obtener parámetros de filtrado
        bodega_id = request.query_params.get('bodega_id')
        sucursal_id = request.query_params.get('sucursal_id')
        search = request.query_params.get('search', '').strip()
        
        # Filtro base para productos desactivados
        queryset = Productos.objects.filter(activo=False)
        
        # Aplicar filtros adicionales
        if bodega_id:
            queryset = queryset.filter(bodega_fk=bodega_id)
        elif sucursal_id:
            queryset = queryset.filter(sucursal_fk=sucursal_id)
        
        # Búsqueda por nombre o código
        if search:
            queryset = queryset.filter(
                models.Q(nombre_prodc__icontains=search) |
                models.Q(codigo_interno__icontains=search)
            )
        
        # Ordenar por fecha de creación (más recientes primero)
        queryset = queryset.order_by('-fecha_creacion')
        
        # Serializar los productos
        productos_data = []
        for producto in queryset:
            # Obtener información del stock
            stock_actual = 0
            stock_minimo = 0
            stock_maximo = 0
            
            if producto.bodega_fk:
                stock_obj = Stock.objects.filter(
                    productos_fk=producto,
                    bodega_fk=producto.bodega_fk.id_bdg
                ).first()
            elif producto.sucursal_fk:
                stock_obj = Stock.objects.filter(
                    productos_fk=producto,
                    sucursal_fk=producto.sucursal_fk.id
                ).first()
            else:
                stock_obj = None
            
            if stock_obj:
                stock_actual = float(stock_obj.stock)
                stock_minimo = float(stock_obj.stock_minimo) if stock_obj.stock_minimo else 0
                stock_maximo = float(stock_obj.stock_maximo) if stock_obj.stock_maximo else 0
            
            productos_data.append({
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo': producto.codigo_interno,
                'descripcion': producto.descripcion_prodc or '',
                'marca': {
                    'id': producto.marca_fk.id_mprod,
                    'nombre': producto.marca_fk.nombre_mprod
                } if producto.marca_fk else None,
                'categoria': {
                    'id': producto.categoria_fk.id,
                    'nombre': producto.categoria_fk.nombre
                } if producto.categoria_fk else None,
                'bodega': {
                    'id': producto.bodega_fk.id_bdg,
                    'nombre': producto.bodega_fk.nombre_bdg
                } if producto.bodega_fk else None,
                'sucursal': {
                    'id': producto.sucursal_fk.id,
                    'nombre': producto.sucursal_fk.nombre_sucursal
                } if producto.sucursal_fk else None,
                'fecha_creacion': producto.fecha_creacion,
                'stock': {
                    'actual': stock_actual,
                    'minimo': stock_minimo,
                    'maximo': stock_maximo
                }
            })
        
        return Response({
            'productos': productos_data,
            'total': len(productos_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener productos desactivados: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reactivar_productos(request):
    """Reactiva múltiples productos seleccionados"""
    try:
        producto_ids = request.data.get('producto_ids', [])
        
        if not producto_ids:
            return Response({
                'error': 'Debe seleccionar al menos un producto para reactivar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que todos los productos existan y estén desactivados
        productos_desactivados = Productos.objects.filter(
            id_prodc__in=producto_ids,
            activo=False
        )
        
        if len(productos_desactivados) != len(producto_ids):
            return Response({
                'error': 'Algunos productos no existen o ya están activos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reactivar productos
        productos_reactivados = []
        for producto in productos_desactivados:
            producto.activo = True
            producto.save()
            
            productos_reactivados.append({
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo': producto.codigo_interno
            })
        
        return Response({
            'message': f'Se reactivaron {len(productos_reactivados)} productos exitosamente',
            'productos_reactivados': productos_reactivados
        })
        
    except Exception as e:
        return Response({
            'error': f'Error al reactivar productos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reactivar_producto_individual(request, producto_id):
    """Reactiva un producto individual"""
    try:
        try:
            producto = Productos.objects.get(id_prodc=producto_id, activo=False)
        except Productos.DoesNotExist:
            return Response({
                'error': 'Producto no encontrado o ya está activo'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Reactivar el producto
        producto.activo = True
        producto.save()
        
        return Response({
            'message': f'Producto "{producto.nombre_prodc}" reactivado exitosamente',
            'producto': {
                'id': producto.id_prodc,
                'nombre': producto.nombre_prodc,
                'codigo': producto.codigo_interno
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Error al reactivar producto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistorialPedidosViewSet(viewsets.ModelViewSet):
    queryset = Historial.objects.all().order_by('-fecha')
    serializer_class = HistorialPedidosDetalladoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtros opcionales por query params
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        usuario_id = self.request.query_params.get('usuario_id')
        pedido_id = self.request.query_params.get('pedido_id')
        producto_id = self.request.query_params.get('producto_id')
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        if usuario_id:
            queryset = queryset.filter(usuario_fk__id_us=usuario_id)
        if pedido_id:
            queryset = queryset.filter(pedidos_fk__id_p=pedido_id)
        if producto_id:
            queryset = queryset.filter(producto_fk__id_prodc=producto_id)
        return queryset

    def perform_create(self, serializer):
        print("DEBUG - request.data:", self.request.data)
        usuario = self.request.user
        pedido_id = self.request.data.get('pedidos_fk')
        producto_id = self.request.data.get('producto_fk')
        if not pedido_id:
            raise serializers.ValidationError({'pedidos_fk': 'Este campo es obligatorio.'})
        if not producto_id:
            raise serializers.ValidationError({'producto_fk': 'Este campo es obligatorio.'})
        try:
            pedido = Pedidos.objects.get(id_p=pedido_id)
        except Pedidos.DoesNotExist:
            raise serializers.ValidationError({'pedidos_fk': 'El pedido no existe.'})
        try:
            producto = Productos.objects.get(id_prodc=producto_id)
        except Productos.DoesNotExist:
            raise serializers.ValidationError({'producto_fk': 'El producto no existe.'})
        serializer.save(usuario_fk=usuario, pedidos_fk=pedido, producto_fk=producto)


class HistorialEstadoPedidoView(generics.ListAPIView):
    serializer_class = HistorialEstadoPedidoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        pedido_id = self.kwargs.get('pedido_id')
        return HistorialEstadoPedido.objects.filter(pedido_fk=pedido_id).order_by('fecha')

