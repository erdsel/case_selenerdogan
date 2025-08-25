import os
import subprocess
import sys


def run_command(command, description):
    """Run a shell command and handle errors."""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f" {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f" {description} failed")
        print(f"Error: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False


def main():
    """Run database migrations."""
    print(" Starting database migration process...")
    
    # Change to the backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(backend_dir)
    print(f" Working directory: {backend_dir}")
    
    # Initialize Alembic (only if not already initialized)
    if not os.path.exists("alembic/versions"):
        print(" Initializing Alembic...")
        os.makedirs("alembic/versions", exist_ok=True)
    
    # Generate initial migration
    if not run_command("alembic revision --autogenerate -m 'Initial migration'", 
                      "Generating initial migration"):
        return False
    
    # Apply migrations
    if not run_command("alembic upgrade head", "Applying migrations"):
        return False
    
    print(" Migration process completed successfully!")
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)