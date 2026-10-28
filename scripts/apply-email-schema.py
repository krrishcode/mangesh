"""Apply the reviewed additive email schema through the VPS's PostgreSQL container."""
import getpass
from pathlib import Path
import paramiko

client = paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.RejectPolicy())
try:
    client.connect('161.97.121.145', username='root', password=getpass.getpass('VPS SSH password: '), timeout=15)
    source = Path('src/server/db/sql/20261028_email_notifications.sql').read_text(encoding='utf8')
    stdin, stdout, stderr = client.exec_command('docker exec -i postgresql-usq2bp06rf8rd0lkmxhtfpxi sh -c \'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d mangesh\'')
    stdin.write(source)
    stdin.channel.shutdown_write()
    output, error = stdout.read().decode(), stderr.read().decode()
    if stdout.channel.recv_exit_status() != 0:
        raise RuntimeError(error)
    print(output)
finally:
    client.close()
