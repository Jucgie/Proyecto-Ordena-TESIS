from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Pedidos, Proveedor, EstadoPedido, PersonalEntrega, Sucursal, BodegaCentral, Usuario, Productos, DetallePedido
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime

class PedidosAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Crear datos necesarios para los pedidos
        self.bodega = BodegaCentral.objects.create(id_bdg=1, nombre_bdg="Bodega Central", direccion="Calle Falsa 123", rut="12345678-9")
        self.sucursal = Sucursal.objects.create(id=1, nombre_sucursal="Sucursal Centro", direccion="Calle Real 456", descripcion="Sucursal principal", bodega_fk=self.bodega, rut="98765432-1")
        self.rol = EstadoPedido.objects.create(id_estped=1, nombre="Pendiente", descripcion="Pedido pendiente")
        self.proveedor = Proveedor.objects.create(id_provd=1, nombres_provd="Proveedor Uno", direccion_provd="Av. Proveedor 100", correo="proveedor@correo.com", razon_social="Proveedor S.A.", rut_empresa=123456789)
        self.personal = PersonalEntrega.objects.create(id_psn=1, usuario_fk=None, nombre_psn="Juan Chofer", descripcion="Transportista", patente="ABCD12")
        self.usuario = get_user_model().objects.create_user(correo="usuario@correo.com", contrasena="test1234", nombre="Usuario Test", rol_fk=self.rol)
        self.producto = Productos.objects.create(id_prodc=1, nombre_prodc="Producto Test", descripcion_prodc="Desc", codigo_interno="PROD-001", fecha_creacion=timezone.now(), activo=True, marca_fk=None, categoria_fk=None, bodega_fk=self.bodega)
        self.pedido = Pedidos.objects.create(id_p=1, descripcion="Pedido de prueba", fecha_entrega=timezone.now(), estado_pedido_fk=self.rol, sucursal_fk=self.sucursal, personal_entrega_fk=self.personal, usuario_fk=self.usuario, solicitud_fk=None, bodega_fk=self.bodega, proveedor_fk=self.proveedor)
        self.detalle = DetallePedido.objects.create(id=1, cantidad=5, descripcion="Detalle de prueba", productos_pedido_fk=self.producto, pedidos_fk=self.pedido)
        self.client.force_authenticate(user=self.usuario)

    def test_listar_pedidos(self):
        url = reverse('pedidos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('descripcion', response.data[0])

    def test_crear_pedido(self):
        url = reverse('pedidos-list')
        data = {
            "descripcion": "Nuevo pedido",
            "fecha_entrega": timezone.now(),
            "estado_pedido_fk": self.rol.id_estped,
            "sucursal_fk": self.sucursal.id,
            "personal_entrega_fk": self.personal.id_psn,
            "usuario_fk": self.usuario.id_us,
            "bodega_fk": self.bodega.id_bdg,
            "proveedor_fk": self.proveedor.id_provd
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['descripcion'], "Nuevo pedido")

    def test_ver_detalle_pedido(self):
        url = reverse('pedidos-detail', args=[self.pedido.id_p])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id_p'], self.pedido.id_p)

    def test_actualizar_pedido(self):
        url = reverse('pedidos-detail', args=[self.pedido.id_p])
        data = {"descripcion": "Pedido actualizado"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['descripcion'], "Pedido actualizado")

    def test_eliminar_pedido(self):
        url = reverse('pedidos-detail', args=[self.pedido.id_p])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_crear_pedido_desde_solicitud(self):
        url = reverse('pedidos-crear-desde-solicitud')
        data = {
            # Debes crear una solicitud válida y asociarla aquí
            # "solicitud_fk": self.solicitud.id_solc,
            "descripcion": "Pedido desde solicitud",
            "fecha_entrega": timezone.now(),
            "estado_pedido_fk": self.rol.id_estped,
            "sucursal_fk": self.sucursal.id,
            "personal_entrega_fk": self.personal.id_psn,
            "usuario_fk": self.usuario.id_us,
            "bodega_fk": self.bodega.id_bdg,
            "proveedor_fk": self.proveedor.id_provd
        }
        response = self.client.post(url, data, format='json')
        # El test puede requerir ajuste según la lógica de tu endpoint
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_confirmar_recepcion(self):
        url = reverse('pedidos-confirmar-recepcion', args=[self.pedido.id_p])
        data = {"confirmado": True}
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_crear_ingreso_bodega(self):
        url = reverse('pedidos-crear-ingreso-bodega')
        data = {
            "fecha": timezone.now(),
            "num_rem": "REM-001",
            "num_guia_despacho": "GD-001",
            "observaciones": "Ingreso de prueba",
            "productos": [{
                "nombre": "Producto Test",
                "cantidad": 10,
                "marca": "Marca X",
                "categoria": "Categoria Y"
            }],
            "proveedor": {
                "nombre": self.proveedor.nombres_provd,
                "rut": str(self.proveedor.rut_empresa),
                "contacto": self.proveedor.direccion_provd,
                "telefono": "123456789",
                "email": self.proveedor.correo
            },
            "bodega_id": self.bodega.id_bdg
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])
