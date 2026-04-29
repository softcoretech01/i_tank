import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME")

def run_migration():
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        database=DB_NAME,
        autocommit=True
    )
    
    try:
        with conn.cursor() as cursor:
            # Read SQL file
            sql_file = "c:/Users/USER/Downloads/i_tank/Backend/sql/migrate_role_rights.sql"
            with open(sql_file, 'r') as f:
                sql_commands = f.read().split(';')
                
            for command in sql_commands:
                if command.strip():
                    print(f"Executing: {command[:50]}...")
                    cursor.execute(command)
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
