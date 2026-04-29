from app.database import SessionLocal
from sqlalchemy import text

def test_regs():
    print("Testing sp_GetAllRegulations...")
    db = SessionLocal()
    try:
        results = db.execute(text("CALL sp_GetAllRegulations()")).fetchall()
        print(f"Fetched {len(results)} regulations.")
        for r in results:
            print(r)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_regs()
