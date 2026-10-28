"""Deploy only the transactional email worker to the existing Contabo VPS.

Build first with npm run mail:build. Secrets are read from the ignored local
environment and transferred through SSH; the SSH password is not stored.
"""
import getpass
import argparse
import json
import time
from pathlib import Path
from urllib.parse import urlsplit
import paramiko
from dotenv import dotenv_values

config = dotenv_values('.env.local')
parser = argparse.ArgumentParser()
parser.add_argument('--origin', default=config.get('EMAIL_APP_ORIGIN') or 'https://mangeshmahadev.com')
args = parser.parse_args()
origin = urlsplit(args.origin)
if origin.scheme != 'https' or not origin.hostname or origin.username or origin.password or origin.query or origin.fragment or origin.path not in ('', '/'):
    raise RuntimeError('Worker origin must be a plain HTTPS website origin')
email_origin = args.origin.rstrip('/')
required = ['POSTGRES_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM']
if any(not config.get(key) for key in required):
    raise RuntimeError('Missing worker environment configuration')
bundle = Path('dist/email-worker.mjs')
if not bundle.is_file(): raise RuntimeError('Run npm run mail:build first')
client = paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.RejectPolicy())

def run(command):
    _, stdout, stderr = client.exec_command(command, timeout=300)
    output = stdout.read().decode()
    error = stderr.read().decode()
    if stdout.channel.recv_exit_status() != 0: raise RuntimeError(error or output)
    return output.strip()

try:
    client.connect('161.97.121.145', username='root', password=getpass.getpass('VPS SSH password: '), timeout=15)
    existing = run("docker ps -a --filter name='^/mangesh-email-worker$' --format '{{.Names}}'")
    if existing:
        label = run("docker inspect -f '{{index .Config.Labels \"com.mangesh.role\"}}' mangesh-email-worker")
        if label != 'email-worker': raise RuntimeError('An unrelated container already uses this name')
    run('mkdir -p /data/mangesh-email-worker && chmod 700 /data/mangesh-email-worker')
    sftp = client.open_sftp()
    try:
        sftp.put(str(bundle), '/data/mangesh-email-worker/worker.mjs')
        package = {'name':'mangesh-email-worker','private':True,'type':'module','dependencies':{'pg':'8.23.1','nodemailer':'10.2.0','dotenv':'18.0.8'}}
        files = {
            'package.json': json.dumps(package),
            'Dockerfile': 'FROM node:22-alpine\nWORKDIR /app\nCOPY package.json ./\nRUN npm install --omit=dev --ignore-scripts --no-audit --no-fund\nCOPY worker.mjs ./\nUSER node\nCMD ["node","worker.mjs"]\n',
            '.dockerignore': '.env\n',
        }
        values = {key: config[key] for key in required}
        values.update({'NODE_ENV':'production','APP_ORIGIN':email_origin,'EMAIL_APP_ORIGIN':email_origin,'SMTP_REPLY_TO':'support@mangeshmahadev.com','SUPPORT_EMAIL':'support@mangeshmahadev.com'})
        if any('\n' in str(value) or '\r' in str(value) for value in values.values()): raise RuntimeError('Invalid multiline worker configuration')
        files['.env'] = '\n'.join(f'{key}={value}' for key,value in values.items())+'\n'
        for name,content in files.items():
            with sftp.file('/data/mangesh-email-worker/'+name,'w') as handle: handle.write(content)
        sftp.chmod('/data/mangesh-email-worker/.env',0o600)
    finally: sftp.close()
    run('docker build -q -t mangesh-email-worker:20261028 /data/mangesh-email-worker')
    if existing:
        run('docker stop --time 90 mangesh-email-worker')
        run('docker rm mangesh-email-worker')
    run('docker run -d --name mangesh-email-worker --label com.mangesh.role=email-worker --restart unless-stopped --env-file /data/mangesh-email-worker/.env --read-only --tmpfs /tmp --security-opt no-new-privileges:true --cap-drop ALL --memory 128m --log-opt max-size=10m --log-opt max-file=2 mangesh-email-worker:20261028')
    for attempt in range(10):
        logs = run('docker logs --tail 20 mangesh-email-worker 2>&1')
        if 'Email worker ready: schema=public; SMTP verified.' in logs:
            break
        time.sleep(2)
    else:
        raise RuntimeError('Email worker startup checks did not pass; inspect server logs')
    print(run("docker inspect -f 'Worker state: {{.State.Status}}; restart policy: {{.HostConfig.RestartPolicy.Name}}' mangesh-email-worker"))
    print('Worker database/SMTP startup checks passed; email origin: ' + email_origin)
finally:
    client.close()
