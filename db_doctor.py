import subprocess
import json
import sys
import time

def run_command(command):
    """Runs a shell command and returns the output."""
    try:
        result = subprocess.run(command, shell=True, text=True, capture_output=True)
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), -1

def check_docker_status():
    print("--- 1. Checking Docker Status ---")
    stdout, stderr, code = run_command("docker ps --format '{{.Names}} - {{.Status}} - {{.Ports}}'")
    if code != 0:
        print(f"❌ Error running docker: {stderr}")
        return False
    
    print("✅ Docker containers running:")
    print(stdout)
    
    if "moonlight-db" not in stdout:
        print("❌ 'moonlight-db' container is NOT running!")
    else:
        print("✅ 'moonlight-db' is running.")

    if "moonlight-server" not in stdout:
        print("❌ 'moonlight-server' container is NOT running!")
    else:
        print("✅ 'moonlight-server' is running.")
    return True

def check_db_logs():
    print("\n--- 2. Checking Database Logs (Last 20 lines) ---")
    stdout, stderr, code = run_command("docker logs --tail 20 moonlight-db")
    if code != 0:
        print(f"❌ Could not fetch DB logs: {stderr}")
    else:
        print(stdout)
        if "Error" in stdout or "FATAL" in stdout:
            print("⚠️ POTENTIAL ERRORS FOUND IN DB LOGS!")
        else:
            print("✅ DB Logs look okay (no obvious errors in tail).")

def check_server_logs():
    print("\n--- 3. Checking Server Logs (Last 20 lines) ---")
    stdout, stderr, code = run_command("docker logs --tail 20 moonlight-server")
    if code != 0:
        print(f"❌ Could not fetch Server logs: {stderr}")
    else:
        print(stdout)
        if "Connection refused" in stdout or "password authentication failed" in stdout:
            print("❌ SERVER CANNOT CONNECT TO DB!")
        elif "Connected to database" in stdout:
            print("✅ Server reports successful connection to database.")
        else:
            print("ℹ️ Check logs above for connection status.")

def test_db_connection_inside_container():
    print("\n--- 4. Testing DB Connection from INSIDE the DB container ---")
    # Try to execute a simple psql command inside the container
    cmd = "docker exec moonlight-db psql -U postgres -d moonlight -c 'SELECT NOW();'"
    stdout, stderr, code = run_command(cmd)
    
    if code == 0:
        print("✅ Connection Successful! Database is responsive.")
        print(f"   Response: {stdout}")
    else:
        print("❌ FAILED to connect using psql inside container.")
        print(f"   Error: {stderr}")

def test_connection_from_server_container():
    print("\n--- 5. Testing Network Connectivity from Server Container to DB ---")
    # Check if server container can verify db host
    cmd = "docker exec moonlight-server getent hosts db"
    stdout, stderr, code = run_command(cmd)
    if code == 0:
        print(f"✅ Server container can resolve 'db' hostname: {stdout}")
    else:
        print("❌ Server container CANNOT resolve 'db' hostname.")

def check_tables():
    print("\n--- 6. Checking Database Tables ---")
    cmd = "docker exec moonlight-db psql -U postgres -d moonlight -c '\dt'"
    stdout, stderr, code = run_command(cmd)
    
    if code == 0:
        if "No relations found" in stdout:
             print("❌ Database is empty! No tables found. Did the seed script run?")
        else:
             print("✅ Tables found:")
             print(stdout)
    else:
        print("❌ Could not list tables.")

def main():
    print("==========================================")
    print("   MOONLIGHT PROJECT DIAGNOSTIC TOOL")
    print("==========================================")
    
    if not check_docker_status():
        print("Aborting further tests due to Docker issues.")
        return

    check_db_logs()
    check_server_logs()
    test_db_connection_inside_container()
    test_connection_from_server_container()
    check_tables()

    print("\n==========================================")
    print("   DIAGNOSTIC COMPLETE")
    print("==========================================")

if __name__ == "__main__":
    main()
