from app.database import SessionLocal, get_db_connection
from sqlalchemy import text

def test_sp():
    print("Testing sp_GetAllMasters result sets...")
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.callproc("sp_GetAllMasters")
            
            count = 0
            while True:
                results = cursor.fetchall()
                print(f"Result set {count+1}: {len(results)} rows")
                count += 1
                if not cursor.nextset():
                    break
            print(f"Total result sets: {count}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_sp()
