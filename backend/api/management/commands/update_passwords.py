from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from api.models import Usuario

class Command(BaseCommand):
    help = 'Actualiza las contraseñas existentes al formato de Django'

    def handle(self, *args, **options):
        usuarios = Usuario.objects.all()
        for usuario in usuarios:
            if not usuario.contrasena.startswith('pbkdf2_sha256$'):
                self.stdout.write(f'Actualizando contraseña para usuario: {usuario.correo}')
                usuario.contrasena = make_password(usuario.contrasena)
                usuario.save()
                self.stdout.write(self.style.SUCCESS(f'Contraseña actualizada para {usuario.correo}'))
            else:
                self.stdout.write(f'La contraseña de {usuario.correo} ya está en formato Django') 