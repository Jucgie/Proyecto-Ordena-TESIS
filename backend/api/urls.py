from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ( 
    login, register, ProductoViewSet, MarcaViewSet, CategoriaViewSet, 
    SolicitudesViewSet, UsuarioViewSet, InformeViewSet, PedidosViewSet, 
    PersonalEntregaViewSet, ProveedorViewSet, ExtraerProductosPDF,generar_qr_producto_view, producto_por_codigo, actualizar_stock_por_codigo, lista_productos_qr, validar_codigo_producto, verificar_producto_existente, producto_por_codigo_unico, buscar_productos_similares_endpoint, movimientos_inventario, pedidos_recientes, NotificacionViewSet,BodegaCentralViewSet, BuscarProductosSimilaresSucursalView
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
    
    
    # URLs para códigos QR
    path('qr/producto/<int:producto_id>/', generar_qr_producto_view, name='generar_qr_producto'),
    path('qr/producto-codigo/<str:codigo_interno>/', producto_por_codigo, name='producto_por_codigo'),
    path('qr/validar-codigo/<str:codigo_interno>/', validar_codigo_producto, name='validar_codigo_producto'),
    path('qr/actualizar-stock/', actualizar_stock_por_codigo, name='actualizar_stock_por_codigo'),
    path('qr/lista-productos/', lista_productos_qr, name='lista_productos_qr'),
    path('verificar-producto/', verificar_producto_existente, name='verificar_producto_existente'),
    path('producto-codigo-unico/<str:codigo_interno>/', producto_por_codigo_unico, name='producto_por_codigo_unico'),
    path('buscar-productos-similares/', buscar_productos_similares_endpoint, name='buscar_productos_similares_endpoint'),
    path('pedidos_recientes/', pedidos_recientes, name='pedidos_recientes'),
    path('movimientos-inventario/', movimientos_inventario, name='movimientos-inventario'),
    path('buscar-productos-similares-sucursal/', BuscarProductosSimilaresSucursalView.as_view(), name='buscar_productos_similares_sucursal'),
]

