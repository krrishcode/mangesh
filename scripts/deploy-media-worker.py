"""Deploy the durable R2 cleanup worker; credentials stay in ignored environment files."""
import getpass
import json
import time
from pathlib import Path
import paramiko
from dotenv import dotenv_values

config={**dotenv_values('.env.local'),**dotenv_values('.env.r2.local')}
required=['POSTGRES_URL','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_PUBLIC_URL','CLOUDFLARE_ZONE_ID','CLOUDFLARE_CACHE_TOKEN']
if any(not config.get(key) for key in required):raise RuntimeError('Missing PostgreSQL/R2 settings')
bundle=Path('dist/media-worker.mjs')
if not bundle.is_file():raise RuntimeError('Run npm run media:build first')
client=paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.RejectPolicy())
def run(command):
    _,out,err=client.exec_command(command,timeout=300)
    text,error=out.read().decode(),err.read().decode()
    if out.channel.recv_exit_status()!=0:raise RuntimeError(error or text)
    return text.strip()
try:
    client.connect('161.97.121.145',username='root',password=getpass.getpass('VPS SSH password: '),timeout=15)
    existing=run("docker ps -a --filter name='^/mangesh-media-worker$' --format '{{.Names}}'")
    if existing and run('docker inspect -f \'{{index .Config.Labels "com.mangesh.role"}}\' mangesh-media-worker')!='media-worker':raise RuntimeError('An unrelated container uses this name')
    run('mkdir -p /data/mangesh-media-worker && chmod 700 /data/mangesh-media-worker')
    values={key:config[key] for key in required}
    values['NODE_ENV']='production'
    if any('\n' in str(v) or '\r' in str(v) for v in values.values()):raise RuntimeError('Invalid environment value')
    files={
      'package.json':json.dumps({'name':'mangesh-media-worker','private':True,'type':'module','dependencies':{'pg':'8.23.1','dotenv':'18.0.8','aws4fetch':'1.0.20'}}),
      'Dockerfile':'FROM node:22-alpine\nWORKDIR /app\nCOPY package.json ./\nRUN npm install --omit=dev --ignore-scripts --no-audit --no-fund\nCOPY worker.mjs ./\nUSER node\nCMD ["node","worker.mjs"]\n',
      '.dockerignore':'.env\n',
      '.env':'\n'.join(f'{key}={value}' for key,value in values.items())+'\n',
    }
    sftp=client.open_sftp()
    try:
        sftp.put(str(bundle),'/data/mangesh-media-worker/worker.mjs')
        for name,content in files.items():
            with sftp.file('/data/mangesh-media-worker/'+name,'w') as handle:handle.write(content)
        sftp.chmod('/data/mangesh-media-worker/.env',0o600)
    finally:sftp.close()
    run('docker build -q -t mangesh-media-worker:20261029 /data/mangesh-media-worker')
    if existing:
        run('docker stop --time 90 mangesh-media-worker')
        run('docker rm mangesh-media-worker')
    run('docker run -d --name mangesh-media-worker --label com.mangesh.role=media-worker --restart unless-stopped --env-file /data/mangesh-media-worker/.env --read-only --tmpfs /tmp --security-opt no-new-privileges:true --cap-drop ALL --memory 128m --log-opt max-size=10m --log-opt max-file=2 mangesh-media-worker:20261029')
    for attempt in range(10):
        if 'Media worker ready:' in run('docker logs --tail 20 mangesh-media-worker 2>&1'):break
        time.sleep(2)
    else:raise RuntimeError('Media worker startup checks failed')
    print(run("docker inspect -f 'Media worker: {{.State.Status}}; restart: {{.HostConfig.RestartPolicy.Name}}' mangesh-media-worker"))
finally:client.close()
