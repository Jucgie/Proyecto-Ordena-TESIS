from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ( 
    login, register, ProductoViewSet, MarcaViewSet, CategoriaViewSet, 
    SolicitudesViewSet, UsuarioViewSet, InformeViewSet, PedidosViewSet, 
    PersonalEntregaViewSet, ProveedorViewSet, ExtraerProductosPDF,generar_qr_producto_view, producto_por_codigo, actualizar_stock_con_movimiento, lista_productos_qr, validar_codigo_producto, verificar_producto_existente, producto_por_codigo_unico, buscar_productos_similares_endpoint, movimientos_inventario, pedidos_recientes, NotificacionViewSet,BodegaCentralViewSet, BuscarProductosSimilaresSucursalView, UsuarioNotificacionListView, UsuarioNotificacionDetailView, historial_producto, productos_con_movimientos_recientes, generar_codigo_automatico, productos_desactivados, reactivar_productos, reactivar_producto_individual, HistorialEstadoPedidoView
)

router = DefaultRouter()

router.register(r'bodegas',BodegaCentralViewSet, basename='bodega'),
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'marcas', MarcaViewSet, basename='marca')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'solicitudes', SolicitudesViewSet, basename='solicitud')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'informes', InformeViewSet, basename='informe')
router.register(r'pedidos', PedidosViewSet, basename='pedido')
router.register(r'personal-entrega', PersonalEntregaViewSet, basename='personal-entrega')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login, name='login'),
    path('auth/register/', register, name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('productos/eliminar-producto/', ProductoViewSet.as_view({'delete': 'eliminar_producto'}), name='eliminar_producto'),
    path('productos/actualizar-producto/', ProductoViewSet.as_view({'put': 'actualizar_producto'}), name='actualizar_producto'),
    path('productos/marcas/', MarcaViewSet.as_view({'get': 'marcas'}), name='marcas'),
    path('productos/categorias/', CategoriaViewSet.as_view({'get': 'categorias'}), name='categorias'),
    path('productos/agregar-marca/', MarcaViewSet.as_view({'post': 'agregar_marca'}), name='agregar_marca'),
    path('productos/agregar-categoria/', CategoriaViewSet.as_view({'post': 'agregar_categoria'}), name='agregar_categoria'),
    path('extraer-productos-pdf/', ExtraerProductosPDF.as_view(), name='extraer_productos_pdf'),
    path('pedidos/', PedidosViewSet.as_view({'get':'pedidos'}),name='pedidos'),
    
    path('pedidos/<int:pedido_id>/historial-estado/', HistorialEstadoPedidoView.as_view(), name='historial-estado-pedido'),
    # URL eliminada: actualizar_stock_por_codigo (causaba duplicación de movimientos)
    path('qr/lista-productos/', lista_productos_qr, name='lista_productos_qr'),
    path('verificar-producto/', verificar_producto_existente, name='verificar_producto_existente'),
    path('producto-codigo-unico/<str:codigo_interno>/', producto_por_codigo_unico, name='producto_por_codigo_unico'),
    path('buscar-productos-similares/', buscar_productos_similares_endpoint, name='buscar_productos_similares_endpoint'),
    path('pedidos_recientes/', pedidos_recientes, name='pedidos_recientes'),
    path('movimientos-inventario/', movimientos_inventario, name='movimientos-inventario'),
    path('productos/<int:producto_id>/historial/', historial_producto, name='historial_producto'),
    path('productos/<int:producto_id>/actualizar-stock/', actualizar_stock_con_movimiento, name='actualizar_stock_con_movimiento'),
    path('productos-con-movimientos-recientes/', productos_con_movimientos_recientes, name='productos_con_movimientos_recientes'),
    path('buscar-productos-similares-sucursal/', BuscarProductosSimilaresSucursalView.as_view(), name='buscar_productos_similares_sucursal'),
    path('usuario-notificaciones/', UsuarioNotificacionListView.as_view(), name='usuario-notificaciones-list'),
    path('usuario-notificaciones/<int:id_ntf_us>/', UsuarioNotificacionDetailView.as_view(), name='usuario-notificaciones-detail'),
    path('generar-codigo-automatico/', generar_codigo_automatico, name='generar_codigo_automatico'),
    
    # URLs para productos desactivados
    path('productos-desactivados/', productos_desactivados, name='productos_desactivados'),
    path('reactivar-productos/', reactivar_productos, name='reactivar_productos'),
    path('reactivar-producto/<int:producto_id>/', reactivar_producto_individual, name='reactivar_producto_individual'),
]

