import paramiko
import sys

host = '76.13.23.233'
port = 22
password = 'MMA@23?vps?access'

def try_connect(username):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, port=port, username=username, password=password, timeout=10)
        return client
    except Exception as e:
        try:
            client.close()
        except:
            pass
        return None

# Try root first, then common usernames
for user in ['root', 'admin', 'ubuntu', 'debian', 'ligat', 'vps', 'www-data']:
    print(f"\n=== Trying username: {user} ===")
    client = try_connect(user)
    if client is None:
        print(f"Failed to connect as {user}")
        continue
    
    print(f"Connected as {user}!")
    
    # 1. Check web server type
    stdin, stdout, stderr = client.exec_command('echo "=== Web Servers ==="; which nginx 2>/dev/null; which apache2 2>/dev/null; which httpd 2>/dev/null; echo "=== Nginx sites ==="; ls /etc/nginx/sites-enabled/ 2>/dev/null; echo "=== Apache sites ==="; ls /etc/apache2/sites-enabled/ 2>/dev/null; echo "=== Apache conf.d ==="; ls /etc/httpd/conf.d/ 2>/dev/null')
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err: print("STDERR:", err)
    
    # 2. Find nginx configs for ligat.my.id
    stdin, stdout, stderr = client.exec_command('echo "=== Nginx configs with ligat.my.id ==="; grep -rl "ligat.my.id" /etc/nginx/ 2>/dev/null; echo "=== Apache configs with ligat.my.id ==="; grep -rl "ligat.my.id" /etc/apache2/ 2>/dev/null')
    print(stdout.read().decode())
    
    # 3. Find ligat directory
    stdin, stdout, stderr = client.exec_command('echo "=== /var/www/ contents ==="; ls -la /var/www/ 2>/dev/null; echo "=== /var/www/ligat/ ==="; ls -la /var/www/ligat/ 2>/dev/null; echo "=== /var/www/html/ ==="; ls -la /var/www/html/ 2>/dev/null; echo "=== Searching for ligat dirs ==="; find / -maxdepth 4 -type d -name "*ligat*" 2>/dev/null')
    print(stdout.read().decode())
    
    # 4. Read the nginx/apache config for ligat
    stdin, stdout, stderr = client.exec_command('echo "=== Reading nginx config ==="; cat /etc/nginx/sites-enabled/*ligat* 2>/dev/null || cat /etc/nginx/sites-available/*ligat* 2>/dev/null; echo "=== Reading Apache config ==="; cat /etc/apache2/sites-enabled/*ligat* 2>/dev/null || cat /etc/apache2/sites-available/*ligat* 2>/dev/null')
    print(stdout.read().decode())
    
    # 5. Check web root with php files
    stdin, stdout, stderr = client.exec_command('echo "=== PHP files in likely web roots ==="; find /var/www -name "*.php" -maxdepth 2 2>/dev/null | head -30; echo "=== Server status ==="; systemctl status nginx 2>/dev/null | head -5; systemctl status apache2 2>/dev/null | head -5')
    print(stdout.read().decode())
    
    # 6. Hostname
    stdin, stdout, stderr = client.exec_command('hostname; cat /etc/hostname 2>/dev/null')
    print("Hostname:", stdout.read().decode())
    
    client.close()
    break
