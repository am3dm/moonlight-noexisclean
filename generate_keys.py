import jwt
import time

secret = "super-secret-jwt-token-with-at-least-32-characters-length"

def generate_key(role):
    payload = {
        "role": role,
        "iss": "supabase",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3153600000 # 100 years
    }
    return jwt.encode(payload, secret, algorithm="HS256")

print(f"JWT_SECRET={secret}")
print(f"ANON_KEY={generate_key('anon')}")
print(f"SERVICE_ROLE_KEY={generate_key('service_role')}")
